// socket.ts
import { Server } from "socket.io";

export const io = new Server(3001, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string;

  socket.join(`user:${userId}`);
});
