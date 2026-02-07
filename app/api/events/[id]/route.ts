import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

type Params = Promise<{ id: string }>

export async function GET(req: NextRequest, { params }: { params: Params }) {
    try {
        const { id } = await params;
        const eventId = parseInt(id);
        if (isNaN(eventId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
        return NextResponse.json(event);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Params }) {
    try {
        // Require authentication
        const authResult = await requireAuth(req);
        if (authResult.error) {
            return authResult.error;
        }

        const { id } = await params;
        const eventId = parseInt(id);
        if (isNaN(eventId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        const formData = await req.formData();

        const title = formData.get('title') as string;
        const slug = formData.get('slug') as string;
        const shortDescription = formData.get('shortDescription') as string;
        const fullDescription = formData.get('fullDescription') as string;
        const dateStr = formData.get('date') as string;
        const location = formData.get('location') as string;
        const isActiveStr = formData.get('isActive') as string;

        // Files
        const logoFile = formData.get('logoFile') as File | null;
        const featuredMediaFile = formData.get('featuredMediaFile') as File | null;

        // Prepare update data
        const updateData: any = {
            title,
            slug,
            shortDescription,
            fullDescription,
            date: dateStr ? new Date(dateStr) : null,
            location,
            isActive: isActiveStr === 'true',
        };

        // Only update images if new files are provided
        if (logoFile && logoFile.size > 0) {
            updateData.logoData = Buffer.from(await logoFile.arrayBuffer());
            updateData.logoMimeType = logoFile.type;
        }

        if (featuredMediaFile && featuredMediaFile.size > 0) {
            updateData.featuredMediaData = Buffer.from(await featuredMediaFile.arrayBuffer());
            updateData.featuredMediaMimeType = featuredMediaFile.type;
        }

        const event = await prisma.event.update({
            where: { id: eventId },
            data: updateData,
        });

        return NextResponse.json({ message: "Event updated", id: event.id });
    } catch (error: any) {
        console.error("Update error:", error);
        if (error.code === 'P2025') return NextResponse.json({ error: "Event not found" }, { status: 404 });
        if (error.code === 'P2002') return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
    try {
        // Require authentication
        const authResult = await requireAuth(req);
        if (authResult.error) {
            return authResult.error;
        }

        const { id } = await params;
        const eventId = parseInt(id);
        if (isNaN(eventId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        await prisma.event.delete({
            where: { id: eventId },
        });

        return NextResponse.json({ message: "Event deleted" });
    } catch (error: any) {
        if (error.code === 'P2025') return NextResponse.json({ error: "Event not found" }, { status: 404 });
        return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }
}
