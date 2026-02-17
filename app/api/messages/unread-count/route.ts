import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from "@/lib/auth";

/**
 * @openapi
 * /api/messages/unread-count:
 *   get:
 *     tags:
 *       - Messages
 *     summary: Get unread message count
 *     description: Returns the count of unread messages for the authenticated user. Requires authentication.
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Unread message count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// GET: Get count of unread messages
export async function GET(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  
  try {
    const userId = user!.id;

    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
