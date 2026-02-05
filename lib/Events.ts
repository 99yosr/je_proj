import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getEventsByJunior() {
  const session = await getSession();

  if (!session.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { juniorId: true },
  });

  if (!user?.juniorId) {
    throw new Error("Junior not found");
  }

  return prisma.event.findMany({
    where: { juniorId: user.juniorId },
  });
}
