import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from "@/lib/auth";

type Params = Promise<{ id: string }>

// PATCH: Mark message as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { error, user } = await requireAuth(request);
      if (error) return error;
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'x-user-id header is required' }, { status: 401 });
    }

    const { id } = await params;
    const messageId = parseInt(id);

    if (isNaN(messageId)) {
      return NextResponse.json(
        { error: 'Invalid message ID' },
        { status: 400 }
      );
    }

    // Find message and verify the current user is the receiver
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (message.receiverId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only mark your own messages as read' },
        { status: 403 }
      );
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
      include: {
        User_Message_senderIdToUser: {
          select: { id: true, name: true, email: true }
        },
        User_Message_receiverIdToUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ message: updatedMessage }, { status: 200 });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}
