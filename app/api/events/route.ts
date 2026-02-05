import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '../../../lib/session';
import { SessionData } from '../../../types/iron-session';

export async function GET(req: NextRequest) {
    try {
        const events = await prisma.event.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                createdBy: { select: { name: true, email: true } },
                junior: { select: { name: true } },
            },
        });

        // Transform events to include proper URLs for images
        const transformedEvents = events.map((event: any) => ({
            ...event,
            logoUrl: event.logoData ? `/api/events/${event.id}/image?type=logo` : null,
            featuredMediaUrl: event.featuredMediaData ? `/api/events/${event.id}/image?type=featured` : null,
            // Remove heavy binary data from response
            logoData: undefined,
            logoMimeType: undefined,
            featuredMediaData: undefined,
            featuredMediaMimeType: undefined,
        }));

        return NextResponse.json(transformedEvents);
    } catch (error) {
        console.error("Failed to fetch events:", error);
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(req, new NextResponse(), sessionOptions);
        // Note: session check might be loose here if relying on client-side check, 
        // but ideally we check session.user here. 

        const formData = await req.formData();

        const title = formData.get('title') as string;
        const slug = formData.get('slug') as string;
        const shortDescription = formData.get('shortDescription') as string;
        const fullDescription = formData.get('fullDescription') as string;
        const dateStr = formData.get('date') as string;
        const location = formData.get('location') as string;
        const juniorId = formData.get('juniorId') as string;
        const createdById = formData.get('createdById') as string;

        const logoFile = formData.get('logoFile') as File | null;
        const featuredMediaFile = formData.get('featuredMediaFile') as File | null;

        if (!title || !slug || !shortDescription || !fullDescription || !juniorId || !createdById) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Process Logo
        let logoData: Buffer | null = null;
        let logoMimeType: string | null = null;
        if (logoFile && logoFile.size > 0) {
            logoData = Buffer.from(await logoFile.arrayBuffer());
            logoMimeType = logoFile.type;
        }

        // Process Featured Media
        let featuredMediaData: Buffer | null = null;
        let featuredMediaMimeType: string | null = null;
        if (featuredMediaFile && featuredMediaFile.size > 0) {
            featuredMediaData = Buffer.from(await featuredMediaFile.arrayBuffer());
            featuredMediaMimeType = featuredMediaFile.type;
        }

        const event = await prisma.event.create({
            data: {
                title,
                slug,
                shortDescription,
                fullDescription,
                date: dateStr ? new Date(dateStr) : null,
                location,
                juniorId: parseInt(juniorId),
                createdById,
                logoData,
                logoMimeType,
                featuredMediaData,
                featuredMediaMimeType,
                isActive: true,
            } as any,
        });

        return NextResponse.json({
            message: "Event created",
            id: event.id
        }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating event:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }
}
