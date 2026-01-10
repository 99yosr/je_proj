import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

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
        const { id } = await params;
        const eventId = parseInt(id);
        if (isNaN(eventId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        const body = await req.json();
        const {
            title,
            slug,
            shortDescription,
            fullDescription,
            logoUrl,
            featuredMediaUrl,
            date,
            location,
            isActive
        } = body;

        const event = await prisma.event.update({
            where: { id: eventId },
            data: {
                title,
                slug,
                shortDescription,
                fullDescription,
                logoUrl,
                featuredMediaUrl,
                date: date ? new Date(date) : undefined,
                location,
                isActive,
            },
        });

        return NextResponse.json(event);
    } catch (error: any) {
        if (error.code === 'P2025') return NextResponse.json({ error: "Event not found" }, { status: 404 });
        if (error.code === 'P2002') return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
    try {
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
