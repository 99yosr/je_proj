import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titre, description, dateFin, juniorId } = body;

    if (!titre || !description || !dateFin || !juniorId) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        titre,
        description,
        dateFin: new Date(dateFin),
        statut: "EN_ATTENTE",
        junior: {
          connect: { id: Number(juniorId) },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Demande envoyée",
        project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project request:", error);
    return NextResponse.json(
      { error: "Échec de l’envoi de la demande" },
      { status: 500 }
    );
  }
}
