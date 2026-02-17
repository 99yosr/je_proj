import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * @openapi
 * /api/demande_projet:
 *   post:
 *     tags:
 *       - Demande Projet
 *     summary: Submit a project request
 *     description: Creates a new project request with status EN_ATTENTE (pending)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titre
 *               - description
 *               - dateFin
 *               - juniorId
 *             properties:
 *               titre:
 *                 type: string
 *                 description: Project title
 *               description:
 *                 type: string
 *                 description: Project description
 *               dateFin:
 *                 type: string
 *                 format: date-time
 *                 description: Project end date
 *               juniorId:
 *                 type: integer
 *                 description: ID of the junior entreprise
 *     responses:
 *       201:
 *         description: Project request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 project:
 *                   type: object
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
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

        Junior: {
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
