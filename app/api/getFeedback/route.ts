import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        project: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(feedbacks, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de récupérer les feedbacks" },
      { status: 500 }
    );
  }
}

