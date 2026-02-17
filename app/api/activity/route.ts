import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { notifyAllAdmins } from "@/lib/socket";

/**
 * @openapi
 * /api/activity:
 *   post:
 *     tags:
 *       - Activity
 *     summary: Create a new activity
 *     description: Creates a new activity for a junior entreprise. Requires authentication.
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - description
 *               - juniorId
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Activity name
 *               description:
 *                 type: string
 *                 description: Activity description
 *               juniorId:
 *                 type: integer
 *                 description: ID of the associated junior entreprise
 *               image:
 *                 type: string
 *                 nullable: true
 *                 description: Optional image URL or path
 *     responses:
 *       201:
 *         description: Activity created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nom:
 *                   type: string
 *                 description:
 *                   type: string
 *                 image:
 *                   type: string
 *                   nullable: true
 *                 juniorId:
 *                   type: integer
 *                 Junior:
 *                   type: object
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /api/activity:
 *   get:
 *     tags:
 *       - Activity
 *     summary: Get all activities
 *     description: Retrieves all activities, optionally filtered by juniorId. Requires authentication.
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: juniorId
 *         schema:
 *           type: integer
 *         description: Filter activities by junior entreprise ID
 *     responses:
 *       200:
 *         description: List of activities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nom:
 *                     type: string
 *                   description:
 *                     type: string
 *                   image:
 *                     type: string
 *                     nullable: true
 *                   juniorId:
 *                     type: integer
 *                   Junior:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
  const { error, user } = await requireAuth(req);
  if (error) return error;

  try {
    // Get juniorId from query params (optional filter)
    const { searchParams } = new URL(req.url);
    const juniorIdParam = searchParams.get('juniorId');

    const activites = await prisma.activite.findMany({
      where: juniorIdParam ? { juniorId: parseInt(juniorIdParam) } : {},
      include: { Junior: true } // inclut les infos du junior
    });
    return NextResponse.json(activites, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible de récupérer les activités" }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/activity:
 *   put:
 *     tags:
 *       - Activity
 *     summary: Update an activity
 *     description: Updates an existing activity. Requires authentication.
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
 *                 description: Activity ID to update
 *               nom:
 *                 type: string
 *                 description: Activity name
 *               description:
 *                 type: string
 *                 description: Activity description
 *               juniorId:
 *                 type: integer
 *                 description: ID of the associated junior entreprise
 *               image:
 *                 type: string
 *                 nullable: true
 *                 description: Image URL or path
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /api/activity:
 *   delete:
 *     tags:
 *       - Activity
 *     summary: Delete an activity
 *     description: Deletes an existing activity. Requires authentication.
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
 *                 description: Activity ID to delete
 *     responses:
 *       200:
 *         description: Activity deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Activity not found
 *       500:
 *         description: Server error
 */
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