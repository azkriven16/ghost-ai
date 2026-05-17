import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export interface CurrentIdentity {
  userId: string;
  email: string | null;
}

export async function getCurrentIdentity(): Promise<CurrentIdentity | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? null;

  return { userId, email };
}

export async function canAccessProject(
  projectId: string,
  identity: CurrentIdentity
): Promise<boolean> {
  const { userId, email } = identity;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) return false;
  if (project.ownerId === userId) return true;
  if (!email) return false;

  const collaborator = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email } },
    select: { projectId: true },
  });

  return collaborator !== null;
}
