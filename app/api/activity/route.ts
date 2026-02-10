import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { error, user } = await requireAuth(req);
  if (error) return error;

  try {
    const { nom, description, juniorId } = await req.json();

    if (!nom || !description || !juniorId) {
      return NextResponse.json({ error: "Nom, description et juniorId sont requis" }, { status: 400 });
    }

    const activite: Prisma.ActiviteCreateInput = {
      nom,
      description,
      Junior: { connect: { id: Number(juniorId) } }
    };

    const newActivite = await prisma.activite.create({
      data: activite
    });

    return NextResponse.json(newActivite, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible de créer l'activité" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { error, user } = await requireAuth(req);
  if (error) return error;

  try {
    const activites = await prisma.activite.findMany({
      include: { Junior: true } // inclut les infos du junior
    });
    return NextResponse.json(activites, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible de récupérer les activités" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error, user } = await requireAuth(req);
  if (error) return error;

  try {
    const { id, nom, description, juniorId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID est requis" }, { status: 400 });
    }

    const data: Prisma.ActiviteUpdateInput = {};
    if (nom !== undefined) data.nom = nom;
    if (description !== undefined) data.description = description;
    if (juniorId !== undefined) data.Junior = { connect: { id: Number(juniorId) } };

    const updatedActivite = await prisma.activite.update({
      where: { id: Number(id) },
      data
    });

    return NextResponse.json(updatedActivite, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible de mettre à jour l'activité" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { error, user } = await requireAuth(req);
  if (error) return error;

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID est requis" }, { status: 400 });
    }

    await prisma.activite.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ message: "Activité supprimée avec succès" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible de supprimer l'activité" }, { status: 500 });
  }
}