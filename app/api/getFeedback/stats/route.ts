import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

/**
 * @openapi
 * /api/getFeedback/stats:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Get feedback statistics (Admin/RJE)
 *     description: Retrieves feedback statistics with optional junior filter. Requires RJE or ADMIN role.
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: juniorId
 *         schema:
 *           type: integer
 *         description: Optional filter by junior entreprise ID
 *     responses:
 *       200:
 *         description: Feedback statistics with breakdown
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
 *                   properties:
 *                     overallAverage:
 *                       type: number
 *                     totalCount:
 *                       type: integer
 *                     breakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                 events:
 *                   type: object
 *                   properties:
 *                     overallAverage:
 *                       type: number
 *                     totalCount:
 *                       type: integer
 *                     breakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - RJE or ADMIN role required
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
    const { error, user } = await requireRole(req, ['RJE', 'ADMIN']);
    if (error) return error;

    try {
        // Get juniorId from query params (optional filter)
        const { searchParams } = new URL(req.url);
        const juniorIdParam = searchParams.get('juniorId');
        const juniorFilter = juniorIdParam ? { juniorId: parseInt(juniorIdParam) } : {};

        // 1. Fetch data for breakdown - this covers most of what we need
        const [projectBreakdown, eventBreakdown, globalStats] = await Promise.all([
            prisma.project.findMany({
                where: { 
                    ...juniorFilter,
                    Feedback: { some: {} } 
                },
                select: {
                    id: true,
                    titre: true,
                    Feedback: { select: { note: true } }
                }
            }),
            prisma.event.findMany({
                where: { 
                    ...juniorFilter,
                    Feedback: { some: {} } 
                },
                select: {
                    id: true,
                    title: true,
                    Feedback: { select: { note: true } }
                }
            }),
            prisma.feedback.aggregate({
                _avg: { note: true },
                _count: { id: true },
                where: juniorIdParam ? {
                    OR: [
                        { Project: { juniorId: parseInt(juniorIdParam) } },
                        { Event: { juniorId: parseInt(juniorIdParam) } }
                    ]
                } : {}
            })
        ]);

        // 2. Process Projects
        let totalProjectNotes = 0;
        let totalProjectCount = 0;
        const projectList = projectBreakdown.map(p => {
            const count = p.Feedback.length;
            const sum = p.Feedback.reduce((s, f) => s + f.note, 0);
            totalProjectNotes += sum;
            totalProjectCount += count;
            return {
                id: p.id,
                title: p.titre,
                count: count,
                average: parseFloat((sum / count).toFixed(2))
            };
        });

        // 3. Process Events
        let totalEventNotes = 0;
        let totalEventCount = 0;
        const eventList = eventBreakdown.map(e => {
            const count = e.Feedback.length;
            const sum = e.Feedback.reduce((s, f) => s + f.note, 0);
            totalEventNotes += sum;
            totalEventCount += count;
            return {
                id: e.id,
                title: e.title,
                count: count,
                average: parseFloat((sum / count).toFixed(2))
            };
        });

        return NextResponse.json({
            global: {
                average: parseFloat((globalStats._avg.note || 0).toFixed(2)),
                count: globalStats._count.id,
            },
            projects: {
                overallAverage: totalProjectCount > 0 ? parseFloat((totalProjectNotes / totalProjectCount).toFixed(2)) : 0,
                totalCount: totalProjectCount,
                breakdown: projectList
            },
            events: {
                overallAverage: totalEventCount > 0 ? parseFloat((totalEventNotes / totalEventCount).toFixed(2)) : 0,
                totalCount: totalEventCount,
                breakdown: eventList
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching feedback stats:", error);
        return NextResponse.json(
            { error: "Failed to calculate feedback statistics" },
            { status: 500 }
        );
    }
}
