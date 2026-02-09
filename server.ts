import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import next from "next";
import cron from "node-cron";
import  prisma  from "./lib/prisma"; 


const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res); // Next.js pages & route handlers
  });

  // Socket.IO setup
  const io = new IOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`User connected: ${userId}`);

    
    if (typeof userId === "string") {
      socket.join(`user:${userId}`);
    }

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});




// Delete notifications older than 7 days
async function deleteOldNotifications() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const deleted = await prisma.notification.deleteMany({
    where: { createdAt: { lt: sevenDaysAgo } },
  });

  console.log(`[Cron] Deleted ${deleted.count} old notifications`);
}

// Schedule cron: runs every day at midnight
cron.schedule("0 0 * * *", () => {
  deleteOldNotifications().catch(console.error);
});
