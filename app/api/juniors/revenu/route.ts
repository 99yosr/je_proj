import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1); 
    const endOfYear = new Date(today.getFullYear() + 1, 0, 1); 

    
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          {
            dateDebut: {
              gte: startOfYear,
              lt: endOfYear,
            },
          },
          {
            dateFin: {
              gte: startOfYear,
              lt: endOfYear,
            },
          },
        ],
      },
      select: {
        juniorId: true,
        revenu: true,
      },
    });

    if (projects.length === 0) {
      return NextResponse.json({ message: "Aucun projet pour cette année", data: [] });
    }

   
    const revenueByJunior: { [key: number]: number } = {};
    let totalRevenue = 0;

    projects.forEach((p) => {
      const r = p.revenu ?? 0; 
      revenueByJunior[p.juniorId] = (revenueByJunior[p.juniorId] || 0) + r;
      totalRevenue += r;
    });

    if (totalRevenue === 0) {
      return NextResponse.json({ message: "Aucun revenu pour cette année", data: [] });
    }

   
    const percentages = Object.entries(revenueByJunior).map(([juniorId, revenue]) => ({
      juniorId: Number(juniorId),
      percentage: Number(((revenue / totalRevenue) * 100).toFixed(2)),
    }));

    return NextResponse.json({ data: percentages });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
