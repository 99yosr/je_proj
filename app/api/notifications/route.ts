import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prisma';


export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // just fetch notifications
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // mark all as read
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
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

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: "Notification id is required" }, { status: 400 });

  await prisma.notification.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
