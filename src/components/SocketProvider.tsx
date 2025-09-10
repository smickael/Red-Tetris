import { createContext, useEffect, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
}

export const SocketContext = createContext<SocketContextValue>({ socket: null });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const url =
      (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_SERVER_URL) ? import.meta.env.VITE_SERVER_URL : "http://localhost:3001";
    console.log("Connecting to server:", url);
    const newSocket = io(url);

    newSocket.on("connect", () => {
      setSocket(newSocket);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connect_error:", err?.message || err);
    });

    newSocket.on("error", (err) => {
      console.error("Socket error:", err);
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    return () => {
      if (newSocket && newSocket.connected) {
        newSocket.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
