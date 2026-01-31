import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; 
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";


export async function PUT(req: NextRequest) {
  const { error, user } = await requireAuth(req);
      if (error) return error;
  try {
    const body = await req.json();
    const { juniorId, nomJE, description, contact } = body;

    if (!juniorId) {
      return NextResponse.json(
        { error: "juniorId is required" },
        { status: 400 }
      );
    }

    const updatedFiche = await prisma.ficheJE.update({
      where: {
        juniorId: Number(juniorId), 
      },
      data: {
        nomJE,
        description,
        contact,
      },
      include: {
        junior: true,
      },
    });

    return NextResponse.json(updatedFiche, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
