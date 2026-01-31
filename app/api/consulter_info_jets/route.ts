import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {

  try {
    const fiches = await prisma.ficheJE.findMany({
      include: {
        junior: true,
      },
    });

    return NextResponse.json(fiches, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

