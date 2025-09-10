import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const url =
      (import.meta as any).env?.VITE_SERVER_URL || "http://localhost:3001";
  console.log("Connecting to server:", url);
  const newSocket = io(url);

    newSocket.on("connect", () => {
      setSocket(newSocket);
    });

    newSocket.on("connect_error", (err) => {
      // Basic diagnostics in dev
      console.error("Socket connect_error:", err?.message || err);
    });

    newSocket.on("error", (err) => {
      console.error("Socket error:", err);
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return socket;
}
