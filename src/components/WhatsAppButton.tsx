import { useState } from "react"
import { MessageCircle, X } from "lucide-react"
import Chat from "./Chat"
import { useAuth } from "@/context/AuthContext"

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, isAdmin, loading } = useAuth()

  // Never show during auth load or for admin users
  if (loading || isAdmin) return null

  // Read token here — WhatsAppButton re-renders whenever user changes,
  // so this value is always in sync with the current auth state.
  const token = localStorage.getItem("token")

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[320px] h-[480px] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white">
          <div className="flex items-center justify-between px-4 py-3 bg-pink-500 text-white shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <span className="font-semibold text-sm">Chat with us</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:opacity-75 transition-opacity"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <Chat user={user} token={token} bare />
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 bg-pink-500 hover:bg-pink-600 p-4 rounded-full shadow-lg transition-all hover:scale-110"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen
          ? <X size={24} className="text-white" />
          : <MessageCircle size={24} className="text-white" />
        }
      </button>
    </>
  )
}
