import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { name, email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const user = await prisma.user.create({
    data: { name, email },
  });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const { id, name, email } = await req.json();
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id },
    data: { name, email },
  });
  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ message: "User deleted" });
}
