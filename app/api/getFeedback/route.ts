import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Get logged-in user session
    const { session } = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // 2️⃣ Find the junior linked to this user
    const userWithJunior = await prisma.user.findUnique({
      where: { id: userId },
      select: { juniorId: true },
    });

    if (!userWithJunior?.juniorId) {
      return NextResponse.json({ error: "No junior linked to this user" }, { status: 404 });
    }
    const juniorId = userWithJunior.juniorId;

    // 3️⃣ Fetch Projects & Events with feedback for this junior
    const [projects, events] = await Promise.all([
      prisma.project.findMany({
        where: { juniorId, Feedback: { some: {} } },
        select: {
          id: true,
          titre: true,
          Feedback: { select: { note: true } },
        },
      }),
      prisma.event.findMany({
        where: { juniorId, Feedback: { some: {} } },
        select: {
          id: true,
          title: true,
          Feedback: { select: { note: true } },
        },
      }),
    ]);

    // 4️⃣ Calculate Project stats
    let totalProjectNotes = 0;
    let totalProjectCount = 0;
    const projectBreakdown = projects.map(p => {
      const count = p.Feedback.length;
      const sum = p.Feedback.reduce((s, f) => s + f.note, 0);
      totalProjectNotes += sum;
      totalProjectCount += count;
      return {
        id: p.id,
        title: p.titre,
        count,
        average: count > 0 ? parseFloat((sum / count).toFixed(2)) : 0,
      };
    });

    // 5️⃣ Calculate Event stats
    let totalEventNotes = 0;
    let totalEventCount = 0;
    const eventBreakdown = events.map(e => {
      const count = e.Feedback.length;
      const sum = e.Feedback.reduce((s, f) => s + f.note, 0);
      totalEventNotes += sum;
      totalEventCount += count;
      return {
        id: e.id,
        title: e.title,
        count,
        average: count > 0 ? parseFloat((sum / count).toFixed(2)) : 0,
      };
    });

    // 6️⃣ Global stats (feedback from both projects & events for this junior)
    const globalStats = await prisma.feedback.aggregate({
      where: {
        OR: [
          { projectId: { in: projects.map(p => p.id) } },
          { eventId: { in: events.map(e => e.id) } },
        ],
      },
      _avg: { note: true },
      _count: { id: true },
    });

    // 7️⃣ Return JSON
    return NextResponse.json({
      global: {
        average: parseFloat((globalStats._avg.note || 0).toFixed(2)),
        count: globalStats._count.id,
      },
      projects: {
        overallAverage: totalProjectCount > 0 ? parseFloat((totalProjectNotes / totalProjectCount).toFixed(2)) : 0,
        totalCount: totalProjectCount,
        breakdown: projectBreakdown,
      },
      events: {
        overallAverage: totalEventCount > 0 ? parseFloat((totalEventNotes / totalEventCount).toFixed(2)) : 0,
        totalCount: totalEventCount,
        breakdown: eventBreakdown,
      },
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    return NextResponse.json({ error: "Failed to calculate feedback statistics" }, { status: 500 });
  }
}
