import { useContext } from "react";
import { SocketContext } from "../components/SocketProvider";

export function useSocket() {
  return useContext(SocketContext).socket;
}
