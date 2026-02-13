import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from "@/lib/auth";
import { notifyAllAdmins } from '@/lib/socket';

// GET - Get all projects
export async function GET(request: NextRequest) {
  const { error, user } = await requireAuth(request);
      if (error) return error;
  try {
    // Get juniorId from query params (optional filter)
    const { searchParams } = new URL(request.url);
    const juniorIdParam = searchParams.get('juniorId');

    const projects = await prisma.project.findMany({
      where: juniorIdParam ? { juniorId: parseInt(juniorIdParam) } : {},
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
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult.error) {
    return authResult.error;
  }
  const user = authResult.user!;

  try {
    const body = await request.json();
    const { titre, description, statut, dateDebut, dateFin, juniorId, image } = body;

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
        image: image || null,
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

    // Send notification to all admins
    await notifyAllAdmins(
      `New project "${titre}" has been created by ${user.name}`,
      prisma
    );

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

