import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';
import { notifyAllAdmins } from '../../../../lib/socket';

type Params = Promise<{ id: string }>

/**
 * @openapi
 * /api/events/{id}:
 *   get:
 *     tags:
 *       - Events
 *     summary: Get event by ID
 *     description: Retrieves a single event by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 slug:
 *                   type: string
 *                 shortDescription:
 *                   type: string
 *                 fullDescription:
 *                   type: string
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 location:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 juniorId:
 *                   type: integer
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest, { params }: { params: Params }) {
    try {
        const { id } = await params;
        const eventId = parseInt(id);
        if (isNaN(eventId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        const event = await prisma.event.findUnique({
            where: { id: eventId },
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
                // Exclude binary data
                logoMimeType: true,
                featuredMediaMimeType: true,
            },
        });

        if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
        return NextResponse.json(event);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
    }
}

/**
 * @openapi
 * /api/events/{id}:
 *   put:
 *     tags:
 *       - Events
 *     summary: Update an event
 *     description: Updates an existing event. Can update logo and featured media. Requires authentication.
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               shortDescription:
 *                 type: string
 *               fullDescription:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               isActive:
 *                 type: string
 *                 enum: ["true", "false"]
 *               logoFile:
 *                 type: string
 *                 format: binary
 *               featuredMediaFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Invalid ID or slug already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
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
        const user = authResult.user!;
        await notifyAllAdmins(
            `Event "${title}" has been updated by ${user.name}`,
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

        return NextResponse.json(transformedEvent);
    } catch (error: any) {
        console.error("Update error:", error);
        if (error.code === 'P2025') return NextResponse.json({ error: "Event not found" }, { status: 404 });
        if (error.code === 'P2002') return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }
}

/**
 * @openapi
 * /api/events/{id}:
 *   delete:
 *     tags:
 *       - Events
 *     summary: Delete an event
 *     description: Deletes an existing event. Requires authentication.
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
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

        // Get event title before deleting
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { title: true }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        await prisma.event.delete({
            where: { id: eventId },
        });

        // Send notification to all admins
        const user = authResult.user!;
        await notifyAllAdmins(
            `Event "${event.title}" has been deleted by ${user.name}`,
            prisma
        );

        return NextResponse.json({ message: "Event deleted" });
    } catch (error: any) {
        if (error.code === 'P2025') return NextResponse.json({ error: "Event not found" }, { status: 404 });
        return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }
}
