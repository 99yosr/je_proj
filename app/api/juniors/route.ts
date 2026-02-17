import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { requireRole } from "@/lib/auth";

/**
 * @openapi
 * /api/juniors:
 *   get:
 *     tags:
 *       - Juniors
 *     summary: Get all junior entreprises
 *     description: Retrieves all junior entreprises. No authentication required.
 *     responses:
 *       200:
 *         description: List of junior entreprises
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   role:
 *                     type: string
 *                   city:
 *                     type: string
 *                   contact_email:
 *                     type: string
 *                   logo:
 *                     type: string
 *                     nullable: true
 *                   nbrmembres:
 *                     type: integer
 *                     nullable: true
 *       500:
 *         description: Server error
 */
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


/**
 * @openapi
 * /api/juniors:
 *   post:
 *     tags:
 *       - Juniors
 *     summary: Create a new junior entreprise
 *     description: Creates a new junior entreprise. Requires ADMIN role.
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - role
 *               - city
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *               city:
 *                 type: string
 *               contact_email:
 *                 type: string
 *               logo:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Junior entreprise created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /api/juniors:
 *   put:
 *     tags:
 *       - Juniors
 *     summary: Update a junior entreprise
 *     description: Updates an existing junior entreprise. Requires ADMIN role.
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *               city:
 *                 type: string
 *               contact_email:
 *                 type: string
 *               logo:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Junior entreprise updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Missing ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Server error
 */
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


/**
 * @openapi
 * /api/juniors:
 *   delete:
 *     tags:
 *       - Juniors
 *     summary: Delete a junior entreprise
 *     description: Deletes an existing junior entreprise. Requires ADMIN role.
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Junior entreprise deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Server error
 */
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
