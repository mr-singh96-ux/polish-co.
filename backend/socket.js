const { Server } = require("socket.io")
const jwt = require("jsonwebtoken")

/* ─── In-memory state ───────────────────────────────────────────────────── */

let adminSocketId = null
const userSockets = new Map() // userId → { socketId, name, email }

function emitUserList(io) {
  const list = Array.from(userSockets.entries()).map(([id, u]) => ({
    id, name: u.name, email: u.email,
  }))
  console.log(`[socket] user_list → admin:${adminSocketId ?? "none"} | users:[${list.map(u => u.name).join(",")}]`)
  if (!adminSocketId) return
  io.to(adminSocketId).emit("user_list", list)
}

/* ─── Init ──────────────────────────────────────────────────────────────── */

function initSocket(httpServer) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.error("[socket] FATAL: JWT_SECRET is not set — socket auth will reject all connections")
  }

  const io = new Server(httpServer, {
    cors: {
      origin: "*",            // allow any origin (covers localhost and ngrok)
      methods: ["GET", "POST"],
      credentials: false,     // must be false when origin is *
    },
  })

  /* ── JWT auth middleware ── */
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    console.log(`[socket] handshake | hasToken:${!!token} ip:${socket.handshake.address}`)

    if (!token) return next(new Error("AUTH_REQUIRED"))

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        console.warn(`[socket] JWT invalid: ${err.message}`)
        return next(new Error("AUTH_INVALID"))
      }
      socket.user = {
        id:    String(decoded.id),
        email: decoded.email,
        role:  decoded.role,
        name:  socket.handshake.auth.name || decoded.email,
      }
      console.log(`[socket] auth OK | id:${socket.user.id} role:${socket.user.role} name:"${socket.user.name}"`)
      next()
    })
  })

  io.on("connection", (socket) => {
    const { id: userId, role, name, email } = socket.user
    console.log(`[socket] connected | sid:${socket.id} userId:${userId} role:${role}`)

    if (role === "admin") {
      adminSocketId = socket.id
      console.log(`[socket] adminSocketId = ${socket.id}`)
      emitUserList(io)
    } else if (role === "user") {
      userSockets.set(userId, { socketId: socket.id, name, email })
      console.log(`[socket] userSockets.size = ${userSockets.size}`)
      emitUserList(io)
    }

    /* Admin can re-request the list at any time */
    socket.on("get_user_list", () => {
      if (role !== "admin") return
      emitUserList(io)
    })

    /* Message routing */
    socket.on("message", ({ text, toUserId }) => {
      if (!text?.trim()) return
      const timestamp = Date.now()

      if (role === "user") {
        console.log(`[socket] user→admin | from:"${name}" text:"${text.substring(0,40)}"`)
        if (!adminSocketId) {
          socket.emit("error_msg", "No support agent is online right now.")
          return
        }
        io.to(adminSocketId).emit("message", {
          text,
          from: { id: userId, name, role: "user" },
          timestamp,
        })

      } else if (role === "admin") {
        if (!toUserId) return
        const target = userSockets.get(toUserId)
        console.log(`[socket] admin→user | toUserId:${toUserId} found:${!!target} text:"${text.substring(0,40)}"`)
        if (!target) {
          socket.emit("error_msg", "That user is no longer connected.")
          return
        }
        io.to(target.socketId).emit("message", {
          text,
          from: { id: "admin", name, role: "admin" },
          toUserId,
          timestamp,
        })
      }
    })

    /* Cleanup */
    socket.on("disconnect", (reason) => {
      console.log(`[socket] disconnected | sid:${socket.id} userId:${userId} role:${role} reason:${reason}`)
      if (socket.id === adminSocketId) {
        adminSocketId = null
        console.log(`[socket] adminSocketId cleared`)
      } else {
        userSockets.delete(userId)
        console.log(`[socket] user removed | userSockets.size = ${userSockets.size}`)
        emitUserList(io)
      }
    })
  })

  return io
}

module.exports = { initSocket }
