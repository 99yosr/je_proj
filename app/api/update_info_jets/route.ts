import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; 
import { Prisma } from "@prisma/client";


export async function PUT(req: NextRequest) {
  try {
    const { id, titre, description, logo, service, lien } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const data: Prisma.InfosJetsUpdateInput = {};

    if (titre !== undefined) data.titre = titre;
    if (description !== undefined) data.description = description;
    if (logo !== undefined) data.logo = logo;
    if (service !== undefined) data.service = service;
    if (lien !== undefined) data.lien = lien;

    const infosJet = await prisma.infosJets.update({
      where: { id },
      data,
    });

    return NextResponse.json(infosJet, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

