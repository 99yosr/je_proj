import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * @openapi
 * /api/consulter_info_jets:
 *   get:
 *     tags:
 *       - Consulter Info Jets
 *     summary: Get all FicheJE records
 *     description: Retrieves all FicheJE (Junior Entreprise information sheets) records with associated Junior details
 *     responses:
 *       200:
 *         description: List of FicheJE records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nomJE:
 *                     type: string
 *                   description:
 *                     type: string
 *                   contact:
 *                     type: string
 *                   juniorId:
 *                     type: integer
 *                   Junior:
 *                     type: object
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {

  try {
    const fiches = await prisma.ficheJE.findMany({
      include: {
        Junior: true,
      },
    });

    return NextResponse.json(fiches, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

