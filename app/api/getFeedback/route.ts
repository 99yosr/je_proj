import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        project: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(feedbacks, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de récupérer les feedbacks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      contenu,
      note,
      projectId,
      eventId,
    } = body;

    // Champs obligatoires
    if (!contenu || note === undefined) {
      return NextResponse.json(
        { error: "contenu and note are required" },
        { status: 400 }
      );
    }

    // Au moins une relation obligatoire
    if (!projectId && !eventId) {
      return NextResponse.json(
        { error: "projectId or eventId is required" },
        { status: 400 }
      );
    }

    // Validation note
    const noteNumber = Number(note);
    if (isNaN(noteNumber) || noteNumber < 0 || noteNumber > 5) {
      return NextResponse.json(
        { error: "Invalid note value (0–5 expected)" },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        contenu,
        note: noteNumber,

        ...(projectId && {
          project: {
            connect: { id: Number(projectId) },
          },
        }),

        ...(eventId && {
          event: {
            connect: { id: Number(eventId) },
          },
        }),
      },
    });

    return NextResponse.json(feedback, { status: 201 });

  } catch (error: any) {
    console.error("Error creating feedback:", error);

    // Clé étrangère invalide (project ou event inexistant)
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Project or Event not found" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}