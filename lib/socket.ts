import { Server as IOServer } from "socket.io";
import { PrismaClient } from "@prisma/client";

export function setIO(socketIO: IOServer) {
  (globalThis as any).__socketIO = socketIO;
  console.log("[socket.ts] Socket.IO instance set globally");
}

export function getIO(): IOServer | null {
  return (globalThis as any).__socketIO || null;
}

export async function createNotification(
  userId: string,
  message: string,
  prisma: PrismaClient
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        message,
        isRead: false,
      },
    });

    const socketIO = getIO();

    if (socketIO) {
      socketIO.to(`user:${userId}`).emit("notification", {
        id: notification.id,
        message: notification.message,
        createdAt: notification.createdAt,
        isRead: notification.isRead,
      });
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function notifyAllAdmins(
  message: string,
  prisma: PrismaClient
) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    const notifications = await Promise.all(
      admins.map((admin) =>
        createNotification(admin.id, message, prisma)
      )
    );

    return notifications;
  } catch (error) {
    console.error("Error notifying admins:", error);
    return [];
  }
}
