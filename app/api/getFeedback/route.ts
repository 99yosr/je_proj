import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole  } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { error, user } = await requireRole(req, ['RJE']);
  if (error) return error;
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

