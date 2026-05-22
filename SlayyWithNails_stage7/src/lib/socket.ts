import { io, type Socket } from "socket.io-client"

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000"

/**
 * Creates a fresh authenticated Socket.IO connection.
 * Uses polling → websocket (Socket.IO default order) for maximum reliability.
 */
export function createSocket(token: string, name: string): Socket {
  return io(SOCKET_URL, {
    auth: { token, name },
    // Default Socket.IO transport order: start with HTTP polling, upgrade to WS.
    // This is the most reliable order — do NOT put websocket first.
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })
}
