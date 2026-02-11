import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from "@/lib/auth";
import { notifyAllAdmins } from '@/lib/socket';

// GET - Get a single project by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAuth(request);
      if (error) return error;
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        Feedback: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project, { status: 200 });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT - Update a project by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAuth(request);
      if (error) return error;
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { titre, description, statut, dateDebut, dateFin, image } = body;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(titre && { titre }),
        ...(description && { description }),
        ...(statut && { statut }),
        ...(image !== undefined && { image }),
        ...(dateDebut && { dateDebut: new Date(dateDebut) }),
        ...(dateFin && { dateFin: new Date(dateFin) }),
      },
      include: {
        Feedback: true,
        Junior: true, // To keep the same junior name after updates.
      },
    });

    // Send notification to all admins
    await notifyAllAdmins(
      `Project "${titre}" has been updated by ${user.name}`,
      prisma
    );

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAuth(request);
      if (error) return error;
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { titre: true }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete the project (feedbacks will be cascade deleted)
    await prisma.project.delete({
      where: { id },
    });

    // Send notification to all admins
    await notifyAllAdmins(
      `Project "${existingProject.titre}" has been deleted by ${user.name}`,
      prisma
    );

    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
