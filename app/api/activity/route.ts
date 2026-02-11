import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { notifyAllAdmins } from "@/lib/socket";

export async function POST(req: NextRequest) {
  const { error, user } = await requireAuth(req);
  if (error) return error;

  try {
    const { nom, description, juniorId, image } = await req.json();

    if (!nom || !description || !juniorId) {
      return NextResponse.json({ error: "Nom, description et juniorId sont requis" }, { status: 400 });
    }

    const activite: Prisma.ActiviteCreateInput = {
      nom,
      description,
      image: image || null,
      Junior: { connect: { id: Number(juniorId) } }
    };

    const newActivite = await prisma.activite.create({
      data: activite,
      include: { Junior: true }
    });

    // Send notification to all admins
    await notifyAllAdmins(
      `New activity "${nom}" has been created by ${user.name}`,
      prisma
    );

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
    const { id, nom, description, juniorId, image } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID est requis" }, { status: 400 });
    }

    const data: Prisma.ActiviteUpdateInput = {};
    if (nom !== undefined) data.nom = nom;
    if (description !== undefined) data.description = description;
    if (image !== undefined) data.image = image;
    if (juniorId !== undefined) data.Junior = { connect: { id: Number(juniorId) } };

    const updatedActivite = await prisma.activite.update({
      where: { id: Number(id) },
      data,
      include: { Junior: true }
    });

    // Send notification to all admins
    await notifyAllAdmins(
      `Activity "${nom || 'Unknown'}" has been updated by ${user.name}`,
      prisma
    );

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

    // Get activity name before deleting
    const activity = await prisma.activite.findUnique({
      where: { id: Number(id) },
      select: { nom: true }
    });

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    await prisma.activite.delete({
      where: { id: Number(id) }
    });

    // Send notification to all admins
    await notifyAllAdmins(
      `Activity "${activity.nom}" has been deleted by ${user.name}`,
      prisma
    );

    return NextResponse.json({ message: "Activité supprimée avec succès" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible de supprimer l'activité" }, { status: 500 });
  }
}