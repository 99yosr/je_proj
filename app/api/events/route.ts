import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth } from "@/lib/auth";


export async function GET(req: NextRequest) {
    try {
        const events = await prisma.event.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(events);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { error, user } = await requireAuth(req);
    if (error) return error;
    try {
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
            isActive,
            juniorId,
            createdById
        } = body;

        if (!title || !slug || !shortDescription || !fullDescription || !juniorId || !createdById) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const event = await prisma.event.create({
            data: {
                title,
                slug,
                shortDescription,
                fullDescription,
                logoUrl: logoUrl || null,
                featuredMediaUrl: featuredMediaUrl || null,
                date: date ? new Date(date) : null,
                location: location || null,
                isActive: isActive ?? true,
                juniorId: Number(juniorId),
                createdById: createdById,
            },
        });
        return NextResponse.json(event);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }
}
