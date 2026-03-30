// FRONTEND/src/config/socket.js
import { io } from "socket.io-client";
import { WS_URL } from "./websocket";

export const socket = io(WS_URL, {
    transports: ["websocket"],  // force websocket transport
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
});
