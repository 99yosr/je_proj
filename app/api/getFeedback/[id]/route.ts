import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * @openapi
 * /api/getFeedback/{id}:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Get feedback for specific project
 *     description: Retrieves all feedback and statistics for a specific project. Requires authentication.
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
 *         description: Project feedback statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 global:
 *                   type: object
 *                   properties:
 *                     average:
 *                       type: number
 *                     count:
 *                       type: integer
 *                 projects:
 *                   type: object
 *                 events:
 *                   type: object
 *       400:
 *         description: Invalid project ID
 *       401:
 *         description: Unauthorized
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
    const projectId = parseInt(idParam);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    // Get all feedback for this project
    const feedbacks = await prisma.feedback.findMany({
      where: { projectId },
      include: {
        Project: true,
      },
    });

    // Calculate statistics
    const totalFeedbacks = feedbacks.length;
    const averageRating = totalFeedbacks > 0
      ? feedbacks.reduce((sum, f) => sum + f.note, 0) / totalFeedbacks
      : 0;

    // Format response to match your FeedbackStats type
    const response = {
      global: {
        average: averageRating,
        count: totalFeedbacks,
      },
      projects: {
        overallAverage: averageRating,
        totalCount: totalFeedbacks,
        breakdown: feedbacks.map(f => ({
          id: f.id,
          title: f.Project?.titre || "Unknown",
          count: 1,
          average: f.note,
        })),
      },
      events: {
        overallAverage: 0,
        totalCount: 0,
        breakdown: [],
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("Error fetching project feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}