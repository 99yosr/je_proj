process.env.NODE_ENV = "development";
process.env.NEXT_TELEMETRY_DISABLED = "1";
// Prevent multiple instances
process.env.NODE_OPTIONS = "--max-old-space-size=4096";

import next from "next";
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import cron from "node-cron";
import prisma from "./lib/prisma.js";
import { setIO } from "./lib/socket.js";

const dev = process.env.NODE_ENV !== "production";
const app = next({ 
  dev,
  // Disable turbopack explicitly for Windows compatibility
  turbo: false,
});
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

  // Set Socket.IO instance for use in API routes
  setIO(io);

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`[Socket] Connection attempt with userId:`, userId);
    
    if (typeof userId === "string" && userId !== "null" && userId !== "undefined") {
      socket.join(`user:${userId}`);
      console.log(`[Socket] User joined room user:${userId}`);
      
      // Verify the user is in the room
      console.log(`[Socket] Rooms for socket:`, Array.from(socket.rooms));
    } else {
      console.warn(`[Socket] Invalid userId:`, userId);
    }

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${userId}`);
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

  // Cleanup on exit
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    console.log("SIGINT signal received: closing HTTP server");
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });
});
