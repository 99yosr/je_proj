import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from "@/lib/auth";

// GET - Get all projects
export async function GET(request: NextRequest) {
  const { error, user } = await requireAuth(request);
      if (error) return error;
  try {
    const projects = await prisma.project.findMany({
      include: {
        Feedback: true,
        Junior: true,
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
        Junior: {
          connect: { id: Number(juniorId) },
        },
      },
      include: {
        Feedback: true,
        Junior: true,
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

