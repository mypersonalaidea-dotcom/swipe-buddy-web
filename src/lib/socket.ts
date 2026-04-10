import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Get or create the singleton Socket.IO connection.
 * Authenticates via the JWT stored in localStorage.
 */
export function getSocket(): Socket {
  if (socket) return socket;

  const token = localStorage.getItem("swipebuddy_token");

  // In dev, Vite proxies /socket.io → backend.
  // In prod, Vercel rewrites handle it (or we connect directly).
  const baseUrl =
    import.meta.env.MODE === "development"
      ? window.location.origin // Vite dev server — proxy handles /socket.io
      : "https://swipe-service.onrender.com";

  socket = io(baseUrl, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    autoConnect: false, // we'll connect manually
  });

  return socket;
}

/** Connect the socket (idempotent). */
export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

/** Disconnect & destroy the singleton so next getSocket() creates a fresh one. */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
