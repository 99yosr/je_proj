import next from "next";
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import cron from "node-cron";
import prisma from "./lib/prisma.js";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new IOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (typeof userId === "string") {
      socket.join(`user:${userId}`);
      console.log(`User connected: ${userId}`);
    }

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  // 🔁 cron job example (cleanup notifications older than 7 days)
  cron.schedule("0 0 * * *", async () => {
    await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });
    console.log("Old notifications cleaned");
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`)
  );
});
