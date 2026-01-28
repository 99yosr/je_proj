import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { sendRefusalEmail } from "@/lib/email";


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        feedbacks: true,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();
    const { statut } = body; // Expected: "ACCEPTE", "REFUSE", "TERMINE", "EN_COURS"

    if (isNaN(id) || !statut) {
      return NextResponse.json(
        { error: "ID de projet ou statut manquant" },
        { status: 400 }
      );
    }

    // On récupère le projet avec les infos du Junior pour l'email
    const project = await prisma.project.update({
      where: { id },
      data: { statut },
      include: { junior: true },
    });

    // Si la demande est refusée, on envoie l'email au Visiteur (Junior)
    if (statut === "REFUSE" && project.junior?.contact_email) {
      await sendRefusalEmail(project.junior.contact_email, project.titre);
    }

    return NextResponse.json(
      { message: `Statut mis à jour : ${statut}`, project },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur PATCH /api/demande_projet/[id]:", error);
    return NextResponse.json(
      { error: "Échec de la mise à jour de la décision" },
      { status: 500 }
    );
  }

}