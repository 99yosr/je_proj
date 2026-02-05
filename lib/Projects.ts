export async function getProjectsByJunior() {
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

  return prisma.project.findMany({
    where: { juniorId: user.juniorId },
  });
}

