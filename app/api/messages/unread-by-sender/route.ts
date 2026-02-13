import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from "@/lib/auth";

// GET: Get unread message counts grouped by sender
export async function GET(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  
  try {
    const userId = user!.id;

    // Get unread messages grouped by sender
    const unreadMessages = await prisma.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: userId,
        isRead: false
      },
      _count: {
        id: true
      }
    });

    // Convert to a simple object { senderId: count }
    const counts: Record<string, number> = {};
    unreadMessages.forEach(item => {
      counts[item.senderId] = item._count.id;
    });

    return NextResponse.json({ counts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching unread counts by sender:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread counts' },
      { status: 500 }
    );
  }
}
