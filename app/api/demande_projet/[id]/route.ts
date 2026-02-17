import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendRefusalEmail } from "@/lib/email";


/**
 * @openapi
 * /api/demande_projet/{id}:
 *   get:
 *     tags:
 *       - Demande Projet
 *     summary: Get project request by ID
 *     description: Retrieves a specific project request with feedback. Requires authentication.
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 titre:
 *                   type: string
 *                 description:
 *                   type: string
 *                 dateFin:
 *                   type: string
 *                   format: date-time
 *                 statut:
 *                   type: string
 *                   enum: [EN_ATTENTE, ACCEPTE, REFUSE, EN_COURS, TERMINE]
 *                 juniorId:
 *                   type: integer
 *                 Feedback:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid project ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /api/demande_projet/{id}:
 *   patch:
 *     tags:
 *       - Demande Projet
 *     summary: Update project request status
 *     description: Updates the status of a project request (ACCEPTE, REFUSE, EN_COURS, TERMINE). Sends refusal email if rejected. Requires authentication.
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statut
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [ACCEPTE, REFUSE, EN_COURS, TERMINE]
 *                 description: New project status
 *     responses:
 *       200:
 *         description: Status updated successfully
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
 *         description: Invalid ID or missing status
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAuth(request);
    if (error) return error;
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
      include: { Junior: true },
    });

    // Si la demande est refusée, on envoie l'email au Visiteur (Junior)
    if (statut === "REFUSE" && project.Junior?.contact_email) {
      await sendRefusalEmail(project.Junior.contact_email, project.titre);
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