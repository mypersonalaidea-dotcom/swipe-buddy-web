import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { getSocket, connectSocket, disconnectSocket } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";
import { Socket } from "socket.io-client";
import { UserOnlineEvent } from "@/lib/types/messaging";

interface OnlineUser {
  isOnline: boolean;
  lastSeenAt: string | null;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isUserOnline: (userId: string) => boolean;
  getUserLastSeen: (userId: string) => string | null;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const onlineUsers = useRef<Map<string, OnlineUser>>(new Map());
  // Ref to force re-render when online status changes for components that care
  const [, setOnlineUsersVersion] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
        onlineUsers.current.clear();
      }
      return;
    }

    const newSocket = connectSocket();
    setSocket(newSocket);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    
    const onUserOnline = (payload: UserOnlineEvent) => {
      onlineUsers.current.set(payload.userId, {
        isOnline: payload.isOnline,
        lastSeenAt: payload.lastSeenAt,
      });
      setOnlineUsersVersion((v) => v + 1);
    };

    newSocket.on("connect", onConnect);
    newSocket.on("disconnect", onDisconnect);
    newSocket.on("user_online", onUserOnline);

    return () => {
      newSocket.off("connect", onConnect);
      newSocket.off("disconnect", onDisconnect);
      newSocket.off("user_online", onUserOnline);
      // We don't disconnect the global socket here on unmount, 
      // only when authentication status changes to false.
    };
  }, [isAuthenticated]);

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.current.get(userId)?.isOnline ?? false;
  }, []);

  const getUserLastSeen = useCallback((userId: string) => {
    return onlineUsers.current.get(userId)?.lastSeenAt ?? null;
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, isUserOnline, getUserLastSeen }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
