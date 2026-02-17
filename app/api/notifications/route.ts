/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get notifications for a user
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: List of notifications
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Create a notification for a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Created notification
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Mark a notification as read
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Updated notification
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Delete a notification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Deletion result
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prisma';


export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch notifications without marking as read
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notifications);
}


export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, message } = body;

  if (!userId || !message)
    return NextResponse.json({ error: "userId and message are required" }, { status: 400 });

  const notification = await prisma.notification.create({
    data: { userId, message },
  });

  return NextResponse.json(notification);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: "Notification id is required" }, { status: 400 });

  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json(notification);
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: "Notification id is required" }, { status: 400 });

  await prisma.notification.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
