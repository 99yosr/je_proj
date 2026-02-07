import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const eventId = parseInt(id);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'logo' or 'featured'

    if (isNaN(eventId)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const event: any = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                logoData: true,
                logoMimeType: true,
                featuredMediaData: true,
                featuredMediaMimeType: true,
            } as any,
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        let data: Buffer | null = null;
        let mimeType: string | null | undefined = null;

        if (type === 'logo') {
            data = event.logoData;
            mimeType = event.logoMimeType;
        } else if (type === 'featured') {
            data = event.featuredMediaData;
            mimeType = event.featuredMediaMimeType;
        } else {
            return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
        }

        if (!data || !mimeType) {
            // Return 404 or a placeholder if image missing
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        return new NextResponse(data as unknown as BodyInit, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=3600',
            },
        });

    } catch (error) {
        console.error('Error fetching event image:', error);
        return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }
}
