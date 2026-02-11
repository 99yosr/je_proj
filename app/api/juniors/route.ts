import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const juniors = await prisma.junior.findMany();
    return NextResponse.json(juniors);
  } catch (error) {
    console.log("Erreur GET /api/juniors:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les juniors" },
      { status: 500 }
    );
  }
}


export async function POST(req: NextRequest) {
  const { error, user } = await requireRole(req, ['ADMIN']);
      if (error) return error;
  try {
    const { name, role, city, contact_email, logo } = await req.json();
    if (!name || !role || !city)
      return NextResponse.json(
        { error: "Nom, rôle et ville requis" },
        { status: 400 }
      );

    const newJunior = await prisma.junior.create({
      data: { name, role, city, contact_email, logo: logo || null },
    });

    return NextResponse.json([newJunior]); // retourne un tableau pour le frontend
  } catch (error) {
    console.log("Erreur POST /api/juniors:", error);
    return NextResponse.json(
      { error: "Impossible d'ajouter le junior" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const { error, user } = await requireRole(req, ['ADMIN']);
      if (error) return error;
  try {
    const { id, name, role, city, contact_email, logo } = await req.json();
    if (id === undefined)
      return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const updatedJunior = await prisma.junior.update({
      where: { id }, // ✅ id est Int, pas besoin de BigInt
      data: { 
        name, 
        role, 
        city, 
        contact_email,
        ...(logo !== undefined && { logo })
      },
    });

    return NextResponse.json([updatedJunior]); // retourne un tableau pour le frontend
  } catch (error) {
    console.log("Erreur PUT /api/juniors:", error);
    return NextResponse.json(
      { error: "Impossible de modifier le junior" },
      { status: 500 }
    );
  }
}


export async function DELETE(req: NextRequest) {
  const { error, user } = await requireRole(req, ['ADMIN']);
      if (error) return error;
  try {
    const { id } = await req.json();
    if (id === undefined)
      return NextResponse.json({ error: "ID requis" }, { status: 400 });

    await prisma.junior.delete({ where: { id } }); // ✅ id est Int, pas besoin de BigInt
    return NextResponse.json({ message: "Junior supprimé" });
  } catch (error) {
    console.log("Erreur DELETE /api/juniors:", error);
    return NextResponse.json(
      { error: "Impossible de supprimer le junior" },
      { status: 500 }
    );
  }
}
