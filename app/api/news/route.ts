import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { notifyAllAdmins } from '../../../lib/socket';
import { requireAuth } from '../../../lib/auth';

// GET - Fetch all news or a single news by ID (via query param)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const juniorIdParam = searchParams.get('juniorId');

    if (id) {
      const news = await prisma.news.findUnique({
        where: { id: parseInt(id) },
        include: {
          Junior: {
            select: {
              id: true,
              name: true,
              city: true
            }
          }
        }
      });
      if (!news) {
        return NextResponse.json({ error: 'News not found' }, { status: 404 });
      }
      return NextResponse.json(news);
    }

    const news = await prisma.news.findMany({
      where: juniorIdParam ? { juniorId: parseInt(juniorIdParam) } : {},
      include: {
        Junior: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(news);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

// POST - Create a new news article
export async function POST(req: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(req);
  if (authResult.error) {
    return authResult.error;
  }
  const user = authResult.user!;

  try {
    const { title, content, author, image, juniorId } = await req.json();
    
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const news = await prisma.news.create({
      data: {
        title,
        content,
        author,
        image,
        juniorId: juniorId ? parseInt(juniorId) : null,
      },
      include: {
        Junior: juniorId ? {
          select: {
            id: true,
            name: true,
            city: true
          }
        } : false
      }
    });

    // Send notification to all admins
    await notifyAllAdmins(
      `New news article "${title}" has been created by ${user.name}`,
      prisma
    );

    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create news' }, { status: 500 });
  }
}

// PUT - Update an existing news article
export async function PUT(req: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(req);
  if (authResult.error) {
    return authResult.error;
  }
  const user = authResult.user!;

  try {
    const { id, title, content, author, image } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const news = await prisma.news.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(author !== undefined && { author }),
        ...(image !== undefined && { image }),
      },
      include: {
        Junior: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      }
    });

    // Send notification to all admins
    await notifyAllAdmins(
      `News article "${title}" has been updated by ${user.name}`,
      prisma
    );

    return NextResponse.json(news);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update news' }, { status: 500 });
  }
}

// DELETE - Delete a news article
export async function DELETE(req: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(req);
  if (authResult.error) {
    return authResult.error;
  }
  const user = authResult.user!;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Get news title before deleting
    const news = await prisma.news.findUnique({
      where: { id: parseInt(id) },
      select: { title: true }
    });

    if (!news) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    await prisma.news.delete({
      where: { id: parseInt(id) },
    });

    // Send notification to all admins
    await notifyAllAdmins(
      `News article "${news.title}" has been deleted by ${user.name}`,
      prisma
    );

    return NextResponse.json({ message: 'News deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 });
  }
}
