import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Get all projects
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        feedbacks: true,
        junior: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titre, description, statut, dateDebut, dateFin, juniorId } = body;

    // Validate required fields
    if (!titre || !description || !statut || !dateFin || !juniorId) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        titre,
        description,
        statut: statut || "EN_ATTENTE",
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: new Date(dateFin),
        junior: {
          connect: { id: Number(juniorId) },
        },
      },
      include: {
        feedbacks: true,
        junior: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}