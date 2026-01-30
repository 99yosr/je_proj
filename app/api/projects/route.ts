import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countByYear = searchParams.get('countByYear');


    if (countByYear === 'true') {
      const projects = await prisma.project.findMany({
        select: { createdAt: true },
      });


      const projectsPerYear = projects.reduce<Record<number, number>>((acc, project) => {
        const year = project.createdAt.getFullYear();
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {});

      const result = Object.entries(projectsPerYear)
        .map(([year, count]) => ({ year: Number(year), count }))
        .sort((a, b) => b.year - a.year); // trier du plus récent au plus ancien

      return NextResponse.json(result, { status: 200 });
    }


    const projects = await prisma.project.findMany({
      include: {
        feedbacks: true,
        junior: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titre, description, statut, dateDebut, dateFin, juniorId } = body;


    if (!titre || !description || !statut || !dateFin || !juniorId) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }


    const project = await prisma.project.create({
      data: {
        titre,
        description,
        statut: statut || 'EN_ATTENTE',
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: new Date(dateFin),
        junior: { connect: { id: Number(juniorId) } },
      },
      include: {
        feedbacks: true,
        junior: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
