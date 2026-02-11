import { Server as IOServer } from "socket.io";

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
  prisma: any
) {
  try {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        message,
        isRead: false,
      },
    });

    // Emit real-time notification via Socket.IO
    const socketIO = getIO();
    console.log(`[Socket] Creating notification for user:${userId}`, {
      hasIO: !!socketIO,
      notificationId: notification.id
    });
    
    if (socketIO) {
      socketIO.to(`user:${userId}`).emit("notification", {
        id: notification.id,
        message: notification.message,
        createdAt: notification.createdAt,
        isRead: notification.isRead,
      });
      console.log(`[Socket] Emitted notification to user:${userId}`);
    } else {
      console.warn("[Socket] Socket.IO instance not available!");
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function notifyAllAdmins(
  message: string,
  prisma: any
) {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    console.log(`[Socket] Notifying ${admins.length} admins:`, admins.map(a => a.id));

    // Create notifications for all admins
    const notifications = await Promise.all(
      admins.map((admin) => createNotification(String(admin.id), message, prisma))
    );

    return notifications;
  } catch (error) {
    console.error("Error notifying admins:", error);
    return [];
  }
}
