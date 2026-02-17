/**
 * @openapi
 * /api/projects/stats:
 *   get:
 *     tags: [Projects]
 *     summary: Get project counts grouped by year (optionally filter by juniorId)
 *     parameters:
 *       - in: query
 *         name: juniorId
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Array of year/count objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   year:
 *                     type: integer
 *                   count:
 *                     type: integer
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const juniorId = searchParams.get("juniorId");

    const projects = await prisma.project.findMany({
      where: juniorId ? { juniorId: Number(juniorId) } : {},
      select: { createdAt: true },
    });

    const grouped = projects.reduce<Record<number, number>>((acc, p) => {
      const year = p.createdAt.getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});

    const result = Object.entries(grouped)
      .map(([year, count]) => ({
        year: Number(year),
        count,
      }))
      .sort((a, b) => a.year - b.year);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch project stats" },
      { status: 500 }
    );
  }
}
