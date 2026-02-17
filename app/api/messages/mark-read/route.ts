import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from "@/lib/auth";

/**
 * @openapi
 * /api/messages/mark-read:
 *   post:
 *     tags:
 *       - Messages
 *     summary: Mark all messages from sender as read
 *     description: Marks all unread messages from a specific sender as read. Requires authentication.
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderId
 *             properties:
 *               senderId:
 *                 type: string
 *                 description: ID of the sender whose messages to mark as read
 *     responses:
 *       200:
 *         description: Messages marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 markedCount:
 *                   type: integer
 *       400:
 *         description: Missing senderId
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
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
