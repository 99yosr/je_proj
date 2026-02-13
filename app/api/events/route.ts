import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { notifyAllAdmins } from '../../../lib/socket';

export async function GET(req: NextRequest) {
    try {
        const events = await prisma.event.findMany({
            select: {
                id: true,
                title: true,
                slug: true,
                shortDescription: true,
                fullDescription: true,
                date: true,
                location: true,
                isActive: true,
                updatedAt: true,
                juniorId: true,
                createdById: true,
                // Only select MIME types to check if images exist (not the binary data!)
                logoMimeType: true,
                featuredMediaMimeType: true,
                user: { select: { name: true, email: true } },
                junior: { select: { name: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Transform events to include proper URLs for images
        const transformedEvents = events.map((event: any) => ({
            ...event,
            // Rename relation fields to expected frontend names
            createdBy: event.User,
            junior: event.Junior,
            User: undefined,
            Junior: undefined,
            logoUrl: event.logoMimeType ? `/api/events/${event.id}/image?type=logo` : null,
            featuredMediaUrl: event.featuredMediaMimeType ? `/api/events/${event.id}/image?type=featured` : null,
            // Remove MIME types from response (not needed by frontend)
            logoMimeType: undefined,
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
        // Require authentication and get user from session
        const authResult = await requireAuth(req);
        if (authResult.error) {
            return authResult.error;
        }
        const user = authResult.user!;

        const formData = await req.formData();

        const title = formData.get('title') as string;
        const slug = formData.get('slug') as string;
        const shortDescription = formData.get('shortDescription') as string;
        const fullDescription = formData.get('fullDescription') as string;
        const dateStr = formData.get('date') as string;
        const location = formData.get('location') as string;
        const juniorId = formData.get('juniorId') as string;

        const logoFile = formData.get('logoFile') as File | null;
        const featuredMediaFile = formData.get('featuredMediaFile') as File | null;

        if (!title || !slug || !shortDescription || !fullDescription || !juniorId) {
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
                createdById: user.id, // Use authenticated user's ID from session
                logoData,
                logoMimeType,
                featuredMediaData,
                featuredMediaMimeType,
                isActive: true,
            } as any,
            select: {
                id: true,
                title: true,
                slug: true,
                shortDescription: true,
                fullDescription: true,
                date: true,
                location: true,
                isActive: true,
                updatedAt: true,
                juniorId: true,
                createdById: true,
                logoMimeType: true,
                featuredMediaMimeType: true,
                user: { select: { name: true, email: true } },
                junior: { select: { name: true } },
            },
        });

        // Send notification to all admins
        await notifyAllAdmins(
            `New event "${title}" has been created by ${user.name}`,
            prisma
        );

        // Transform event to include proper URLs for images
        const transformedEvent = {
            ...event,
            createdBy: event.user,
            junior: event.junior,
            user: undefined,
            logoUrl: event.logoMimeType ? `/api/events/${event.id}/image?type=logo` : null,
            featuredMediaUrl: event.featuredMediaMimeType ? `/api/events/${event.id}/image?type=featured` : null,
            logoMimeType: undefined,
            featuredMediaMimeType: undefined,
        };

        return NextResponse.json(transformedEvent, { status: 201 });

    } catch (error: any) {
        console.error("Error creating event:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }
}
