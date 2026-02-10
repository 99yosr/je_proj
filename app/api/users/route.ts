import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { error, user } = await requireRole(req, ['ADMIN']);
  if (error) return error;
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}


export async function PUT(req: NextRequest) {
  const { error, user } = await requireRole(req, ['ADMIN']);
  if (error) return error;
  try {
    const { id, name, email, password, role, nbrmembres } = await req.json();
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const updateData: any = { name, email, role };
    if (password) updateData.password = password;
    if (nbrmembres !== undefined) updateData.nbrmembres = Number(nbrmembres);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { error, user } = await requireRole(req, ['ADMIN']);
  if (error) return error;
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
