import { useEffect, useRef, useState } from "react"
import type { Socket } from "socket.io-client"
import { createSocket } from "@/lib/socket"
import type { AuthUser } from "@/context/AuthContext"

interface Message {
  text: string
  from: { id: string; name: string; role: "admin" | "user" }
  timestamp: number
}

interface ChatProps {
  user: AuthUser | null
  token: string | null
  bare?: boolean
}

export default function Chat({ user, token, bare = false }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [connected, setConnected] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const sockRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !token) return

    // Tear down any lingering socket from a previous mount
    if (sockRef.current) {
      sockRef.current.disconnect()
      sockRef.current = null
    }

    const sock = createSocket(token, user.name)
    sockRef.current = sock

    sock.on("connect", () => {
      setConnected(true)
      setErrorMsg(null)
    })

    sock.on("disconnect", () => {
      setConnected(false)
    })

    sock.on("connect_error", (err) => {
      console.error("[Chat] connect_error:", err.message)
      const msg =
        err.message === "AUTH_REQUIRED" ? "Not logged in — please refresh and log in again." :
        err.message === "AUTH_INVALID"  ? "Session expired — please log in again." :
        `Connection error: ${err.message}`
      setErrorMsg(msg)
    })

    sock.on("message", (msg: Message) => {
      setMessages((prev) => [...prev, msg])
    })

    sock.on("error_msg", (msg: string) => {
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(null), 5000)
    })

    return () => {
      sock.disconnect()
      sockRef.current = null
      setConnected(false)
    }
  }, [user?.id, token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = () => {
    const text = input.trim()
    if (!text || !user || !sockRef.current || !connected) return
    setMessages((prev) => [
      ...prev,
      { text, from: { id: user.id, name: user.name, role: "user" }, timestamp: Date.now() },
    ])
    sockRef.current.emit("message", { text })
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const outer = bare
    ? "flex flex-col h-full bg-white"
    : "flex flex-col h-full border rounded-lg overflow-hidden bg-white"

  /* ── Not logged in ── */
  if (!user || !token) {
    return (
      <div className={outer}>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-center text-gray-500 text-sm">
            Please{" "}
            <a href="/auth" className="text-pink-500 underline">log in</a>
            {" "}to chat with us.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={outer}>
      {/* ── Status bar ── */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b bg-gray-50 shrink-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${connected ? "bg-green-400" : "bg-yellow-400 animate-pulse"}`} />
        <span className="text-xs text-gray-500">{connected ? "Connected" : "Connecting…"}</span>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-xs mt-6">
            {connected ? "Say hello! 👋" : "Connecting to support…"}
          </p>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.from.role === "user"
          return (
            <div key={i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-snug ${
                isMine
                  ? "bg-pink-500 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}>
                <p className="text-[10px] font-semibold mb-0.5 opacity-60">
                  {isMine ? "You" : "Support"}
                </p>
                {msg.text}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Error ── */}
      {errorMsg && (
        <div className="px-3 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 shrink-0">
          {errorMsg}
        </div>
      )}

      {/* ── Input ── */}
      <div className="border-t p-2 flex gap-2 shrink-0">
        <input
          className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          placeholder={connected ? "Type a message…" : "Connecting…"}
          value={input}
          disabled={!connected}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={sendMessage}
          disabled={!connected}
          className="px-3 py-2 bg-pink-500 text-white text-sm rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  )
}
