import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ projectId: string }> };

export interface CollaboratorProfile {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

async function enrichCollaborators(
  emails: string[]
): Promise<Map<string, { displayName: string | null; avatarUrl: string | null }>> {
  const map = new Map<string, { displayName: string | null; avatarUrl: string | null }>();
  if (emails.length === 0) return map;

  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({ emailAddress: emails });
    for (const user of users) {
      const email = user.emailAddresses.find(
        (e) => e.id === user.primaryEmailAddressId
      )?.emailAddress;
      if (!email) continue;
      const displayName =
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username ||
        null;
      map.set(email, { displayName, avatarUrl: user.imageUrl ?? null });
    }
  } catch {
    // Clerk enrichment failure is non-fatal; callers fall back to email-only
  }

  return map;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const isOwner = project.ownerId === userId;

  if (!isOwner) {
    // Only fetch the full Clerk user (expensive) when we actually need the email
    const user = await currentUser();
    const email =
      user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? null;
    if (!email) return Response.json({ error: "Forbidden" }, { status: 403 });
    const collab = await prisma.projectCollaborator.findUnique({
      where: { projectId_email: { projectId, email } },
      select: { projectId: true },
    });
    if (!collab) return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  const enrichMap = await enrichCollaborators(rows.map((r) => r.email));

  const collaborators: CollaboratorProfile[] = rows.map((r) => ({
    email: r.email,
    displayName: enrichMap.get(r.email)?.displayName ?? null,
    avatarUrl: enrichMap.get(r.email)?.avatarUrl ?? null,
  }));

  return Response.json({ collaborators, isOwner });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });
  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = body as Record<string, unknown>;
  const email =
    typeof parsed?.email === "string" && parsed.email.trim()
      ? parsed.email.trim().toLowerCase()
      : null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Valid email is required" }, { status: 400 });
  }

  const collaborator = await prisma.projectCollaborator.upsert({
    where: { projectId_email: { projectId, email } },
    create: { projectId, email },
    update: {},
  });

  const enrichMap = await enrichCollaborators([email]);
  const profile: CollaboratorProfile = {
    email: collaborator.email,
    displayName: enrichMap.get(email)?.displayName ?? null,
    avatarUrl: enrichMap.get(email)?.avatarUrl ?? null,
  };

  return Response.json({ collaborator: profile }, { status: 201 });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });
  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!email) {
    return Response.json({ error: "email query param is required" }, { status: 400 });
  }

  await prisma.projectCollaborator.deleteMany({
    where: { projectId, email },
  });

  return new Response(null, { status: 204 });
}
