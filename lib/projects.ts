import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export interface ProjectRow {
  id: string;
  name: string;
  isOwned: boolean;
}

export async function getProjectsForUser(): Promise<{
  owned: ProjectRow[];
  shared: ProjectRow[];
}> {
  const { userId } = await auth();
  if (!userId) return { owned: [], shared: [] };

  const [ownedRows, user] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    currentUser(),
  ]);

  const email = user?.emailAddresses[0]?.emailAddress;

  const collaboratorRows = email
    ? await prisma.projectCollaborator.findMany({
        where: { email },
        orderBy: { createdAt: "desc" },
        include: { project: { select: { id: true, name: true } } },
      })
    : [];

  return {
    owned: ownedRows.map((p) => ({ id: p.id, name: p.name, isOwned: true })),
    shared: collaboratorRows.map((c) => ({
      id: c.project.id,
      name: c.project.name,
      isOwned: false,
    })),
  };
}
