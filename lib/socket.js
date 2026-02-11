export function setIO(socketIO) {
  globalThis.__socketIO = socketIO;
  console.log("[socket.js] Socket.IO instance set globally");
}

export function getIO() {
  return globalThis.__socketIO || null;
}

export async function createNotification(userId, message, prisma) {
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

export async function notifyAllAdmins(message, prisma) {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    // Create notifications for all admins
    const notifications = await Promise.all(
      admins.map((admin) => createNotification(admin.id, message, prisma))
    );

    return notifications;
  } catch (error) {
    console.error("Error notifying admins:", error);
    return [];
  }
}
