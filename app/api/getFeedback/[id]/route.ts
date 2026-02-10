import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAuth(request);
      if (error) return error;
  try {
    // Récupérer l'id depuis les params (async)
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    // Vérifier que l'id est valide
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid feedback ID" },
        { status: 400 }
      );
    }

    // Chercher le feedback par id
    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        Project: true, // inclure les infos du projet lié
      },
    });

    // Si aucun feedback trouvé
    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    // Succès
    return NextResponse.json(feedback, { status: 200 });

  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
