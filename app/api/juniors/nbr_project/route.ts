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
      },
    });

    if (projects.length === 0) {
      return NextResponse.json({ message: "Aucun projet pour cette année", data: [] });
    }

    
    const counts: { [key: number]: number } = {};
    projects.forEach((p) => {
      counts[p.juniorId] = (counts[p.juniorId] || 0) + 1;
    });

    const totalProjects = projects.length; 

    
    const percentages = Object.entries(counts).map(([juniorId, count]) => ({
      juniorId: Number(juniorId),
      percentage: Number(((count / totalProjects) * 100).toFixed(2)),
    }));

    return NextResponse.json({ data: percentages });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
