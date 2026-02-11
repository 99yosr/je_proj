import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from "@/lib/auth";

// POST: Mark all messages from a sender as read
export async function POST(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  
  try {
    const userId = user!.id;
    const body = await request.json();
    const { senderId } = body;

    if (!senderId) {
      return NextResponse.json(
        { error: 'senderId is required' },
        { status: 400 }
      );
    }

    // Mark all unread messages from this sender to current user as read
    const result = await prisma.message.updateMany({
      where: {
        senderId: senderId,
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    // Emit socket event to update unread count
    const { getIO } = await import('@/lib/socket');
    const socketIO = getIO();
    if (socketIO) {
      socketIO.to(`user:${userId}`).emit('messages-read', { senderId });
    }

    return NextResponse.json({ 
      success: true, 
      markedCount: result.count 
    }, { status: 200 });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
