import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // adapte le chemin si nécessaire

export async function GET(req: NextRequest) {
  try {
    // Récupérer tous les enregistrements de la table InfosJets
    const InfosJets = await prisma.InfosJets.findMany();

    return NextResponse.json(InfosJets, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}   