import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth } from "@/lib/auth";
import bcrypt from 'bcryptjs';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { SessionData } from '@/types/iron-session';

export async function GET(req: NextRequest) {
    const { error, user: sessionUser } = await requireAuth(req);
    if (error || !sessionUser) return error;

    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,

            // Exclude password
        }
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
    const { error, user: sessionUser, session } = await requireAuth(req);
    if (error || !sessionUser) return error;

    try {
        const { name, email, password } = await req.json();

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: sessionUser.id },
            data: updateData,
        });

        // Update session if critical info changed
        session.user = {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,

        };
        await session.save();

        return NextResponse.json({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,

        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
