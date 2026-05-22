import { useEffect, useRef, useState, useCallback } from "react"
import type { Socket } from "socket.io-client"
import { createSocket } from "@/lib/socket"
import { useAuth } from "@/context/AuthContext"
import { Users, MessageSquare, RefreshCw } from "lucide-react"

interface ConnectedUser {
  id: string
  name: string
  email: string
}

interface Message {
  text: string
  from: { id: string; name: string; role: "admin" | "user" }
  toUserId?: string
  timestamp: number
}

type ConnStatus = "connecting" | "connected" | "error"

export default function AdminChat() {
  const { user } = useAuth()
  // Read token inside component — re-read on every render so it's always fresh
  const tokenRef = useRef<string | null>(null)
  tokenRef.current = localStorage.getItem("token")

  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({})
  const [input, setInput] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [unread, setUnread] = useState<Set<string>>(new Set())
  const [connStatus, setConnStatus] = useState<ConnStatus>("connecting")
  const [connError, setConnError] = useState<string>("")

  const sockRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const connect = useCallback(() => {
    const token = tokenRef.current
    if (!user || !token) return

    // Clean up previous socket
    if (sockRef.current) {
      sockRef.current.disconnect()
      sockRef.current = null
    }

    setConnStatus("connecting")
    setConnError("")

    const sock = createSocket(token, user.name)
    sockRef.current = sock

    sock.on("connect", () => {
      setConnStatus("connected")
      setConnError("")
      sock.emit("get_user_list")
    })

    sock.on("disconnect", (reason) => {
      setConnStatus("connecting")
      console.log("[AdminChat] disconnected:", reason)
    })

    sock.on("connect_error", (err) => {
      console.error("[AdminChat] connect_error:", err.message)
      setConnStatus("error")
      setConnError(
        err.message === "AUTH_REQUIRED" ? "Not authenticated — please log out and log in again." :
        err.message === "AUTH_INVALID"  ? "Session invalid — please log out and log in again." :
        `Cannot reach server: ${err.message}`
      )
    })

    sock.on("user_list", (users: ConnectedUser[]) => {
      setConnectedUsers(users)
    })

    sock.on("message", (msg: Message) => {
      const fromUserId = msg.from.id
      setAllMessages((prev) => ({
        ...prev,
        [fromUserId]: [...(prev[fromUserId] || []), msg],
      }))
      setSelectedUserId((sel) => {
        if (sel !== fromUserId) setUnread((u) => new Set(u).add(fromUserId))
        return sel
      })
    })

    sock.on("error_msg", (msg: string) => {
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(null), 5000)
    })
  }, [user])

  // Connect on mount / when user changes
  useEffect(() => {
    connect()
    return () => {
      sockRef.current?.disconnect()
      sockRef.current = null
    }
  }, [connect])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [allMessages, selectedUserId])

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId)
    setUnread((prev) => { const n = new Set(prev); n.delete(userId); return n })
  }

  const sendMessage = () => {
    const text = input.trim()
    if (!text || !selectedUserId || !user || !sockRef.current) return
    const msg: Message = {
      text,
      from: { id: user.id, name: user.name, role: "admin" },
      toUserId: selectedUserId,
      timestamp: Date.now(),
    }
    setAllMessages((prev) => ({
      ...prev,
      [selectedUserId]: [...(prev[selectedUserId] || []), msg],
    }))
    sockRef.current.emit("message", { text, toUserId: selectedUserId })
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const selectedMessages = selectedUserId ? (allMessages[selectedUserId] || []) : []
  const selectedUser = connectedUsers.find((u) => u.id === selectedUserId)

  const dotClass =
    connStatus === "connected" ? "bg-green-400" :
    connStatus === "error"     ? "bg-red-400" :
    "bg-yellow-400 animate-pulse"

  const statusLabel =
    connStatus === "connected" ? "Connected" :
    connStatus === "error"     ? "Error" :
    "Connecting…"

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Live Chat</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {connectedUsers.length} user{connectedUsers.length !== 1 ? "s" : ""} online
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
          <span className="text-xs text-gray-500">{statusLabel}</span>
          {connStatus === "error" && (
            <button
              onClick={connect}
              className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 ml-1"
            >
              <RefreshCw size={12} /> Retry
            </button>
          )}
        </div>
      </div>

      {/* ── Connection error banner ── */}
      {connStatus === "error" && connError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {connError}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex h-[600px]">

        {/* ── User sidebar ── */}
        <div className="w-64 border-r flex flex-col shrink-0">
          <div className="px-4 py-3 border-b bg-gray-50 shrink-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Users size={13} />
              Online Users ({connectedUsers.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {connectedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 p-6">
                <Users size={32} className="opacity-25" />
                <p className="text-sm text-center">
                  {connStatus === "connected" ? "No users online yet" : statusLabel}
                </p>
              </div>
            ) : (
              connectedUsers.map((u) => {
                const isSelected = selectedUserId === u.id
                const hasUnread = unread.has(u.id)
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u.id)}
                    className={`w-full text-left px-4 py-3 border-b transition-colors ${
                      isSelected ? "bg-pink-50 border-l-2 border-l-pink-500" : "hover:bg-gray-50 border-l-2 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${isSelected ? "text-pink-600" : "text-gray-800"}`}>
                          {u.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      {hasUnread && <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Conversation panel ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
              <MessageSquare size={40} className="opacity-25" />
              <p className="text-sm">Select a user to start chatting</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b bg-gray-50 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{selectedUser?.name || selectedUserId}</p>
                    <p className="text-xs text-gray-400">{selectedUser?.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {selectedMessages.length === 0 && (
                  <p className="text-center text-gray-400 text-sm mt-4">No messages yet.</p>
                )}
                {selectedMessages.map((msg, i) => {
                  const isMine = msg.from.role === "admin"
                  return (
                    <div key={i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                        isMine ? "bg-pink-500 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}>
                        <p className="text-[10px] font-semibold mb-0.5 opacity-60">{isMine ? "You" : msg.from.name}</p>
                        {msg.text}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {errorMsg && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 shrink-0">
                  {errorMsg}
                </div>
              )}

              <div className="border-t p-3 flex gap-2 shrink-0">
                <input
                  className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  placeholder={`Reply to ${selectedUser?.name || "user"}…`}
                  value={input}
                  disabled={connStatus !== "connected"}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  onClick={sendMessage}
                  disabled={connStatus !== "connected"}
                  className="px-4 py-2 bg-pink-500 text-white text-sm rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
