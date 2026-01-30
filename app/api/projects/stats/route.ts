import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {

    const { searchParams } = new URL(req.url);
    const juniorId = searchParams.get('juniorId');

    const projectsPerYear = await prisma.project.groupBy({
      by: ['createdAt'],
      _count: {
        id: true,
      },
      where: juniorId ? { juniorId: Number(juniorId) } : {},
    });


    const result = projectsPerYear.map(p => ({
      year: p.createdAt.getFullYear(),
      count: p._count.id,
    }))
    .sort((a, b) => b.year - a.year);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch projects per year' }, { status: 500 });
  }
}
