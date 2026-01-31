import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const juniorId = Number(searchParams.get("juniorId"));
    const year = Number(searchParams.get("year"));

    if (!juniorId || !year) {
      return NextResponse.json(
        { message: "juniorId et year sont obligatoires" },
        { status: 400 }
      );
    }

    
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59`);

    const result = await prisma.project.aggregate({
      _sum: {
        revenu: true,
      },
      where: {
        juniorId: juniorId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return NextResponse.json({
      juniorId,
      year,
      totalRevenu: result._sum.revenu ?? 0,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
