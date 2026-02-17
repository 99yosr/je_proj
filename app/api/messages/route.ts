import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from "@/lib/auth";

/**
 * @openapi
 * /api/messages:
 *   get:
 *     tags:
 *       - Messages
 *     summary: Get messages
 *     description: Retrieves messages (sent or received) or conversation with specific user. Requires authentication.
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sent, received]
 *           default: received
 *         description: Type of messages to retrieve
 *       - in: query
 *         name: otherUserId
 *         schema:
 *           type: string
 *         description: User ID to get conversation with (overrides type parameter)
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       content:
 *                         type: string
 *                       isRead:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       senderId:
 *                         type: string
 *                       receiverId:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// GET: Retrieve messages (sent or received)
export async function GET(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  
  console.log('🔵 GET /api/messages - User authenticated:', user?.id);
  
  try {
    const userId = user!.id;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'received'; // 'sent' or 'received'
    const otherUserId = searchParams.get('otherUserId');

    let messages;

    if (otherUserId) {
      // Get conversation between two users
      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId }
          ]
        },
        include: {
          User_Message_senderIdToUser: {
            select: { id: true, name: true, email: true }
          },
          User_Message_receiverIdToUser: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
    } else if (type === 'sent') {
      messages = await prisma.message.findMany({
        where: { senderId: userId },
        include: {
          User_Message_receiverIdToUser: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      messages = await prisma.message.findMany({
        where: { receiverId: userId },
        include: {
          User_Message_senderIdToUser: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/messages:
 *   post:
 *     tags:
 *       - Messages
 *     summary: Send a new message
 *     description: Sends a message to another user. Requires authentication.
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - content
 *             properties:
 *               receiverId:
 *                 type: string
 *                 description: ID of the recipient user
 *               content:
 *                 type: string
 *                 description: Message content
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Receiver not found
 *       500:
 *         description: Server error
 */
// POST: Send a new message
export async function POST(request: NextRequest) {
  console.log('🔵 POST /api/messages - Request received');
  const { error, user } = await requireAuth(request);
  console.log('🔵 Auth result:', { error: error ? 'ERROR' : 'OK', user: user?.id });
  if (error) return error;
  
  try {
    const userId = user!.id;
    console.log('🔵 userId from session:', userId);

    const body = await request.json();
    console.log('🔵 Request body:', body);
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      console.log('❌ Missing receiverId or content');
      return NextResponse.json(
        { error: 'receiverId and content are required' },
        { status: 400 }
      );
    }

    // Verify receiver exists
    console.log('🔵 Checking if receiver exists:', receiverId);
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      console.log('❌ Receiver not found:', receiverId);
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }
    console.log('✅ Receiver found:', receiver.email);

    console.log('🔵 Creating message in database...', { senderId: userId, receiverId, contentLength: content.length });
    const message = await prisma.message.create({
      data: {
        content,
        senderId: userId,
        receiverId
      },
      include: {
        User_Message_senderIdToUser: {
          select: { id: true, name: true, email: true }
        },
        User_Message_receiverIdToUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    console.log('✅ Message created successfully:', message.id);

    // Emit real-time message via Socket.IO
    const { getIO } = await import('@/lib/socket');
    const socketIO = getIO();
    if (socketIO) {
      // Emit to receiver
      socketIO.to(`user:${receiverId}`).emit('new-message', message);
      // Also emit to sender for multi-device sync
      socketIO.to(`user:${userId}`).emit('new-message', message);
      console.log('✅ Message emitted via socket to users:', userId, receiverId);
    } else {
      console.warn('⚠️ Socket.IO not available');
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
