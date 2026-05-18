import { put, getDownloadUrl } from "@vercel/blob";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ projectId: string }> };

async function checkAccess(projectId: string): Promise<"owner" | "collaborator" | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) return null;
  if (project.ownerId === userId) return "owner";

  // Only call currentUser() for the non-owner collaborator path
  const user = await currentUser();
  const email =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? null;
  if (!email) return null;

  const collaborator = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email } },
    select: { projectId: true },
  });
  return collaborator ? "collaborator" : null;
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { projectId } = await params;

  const access = await checkAccess(projectId);
  if (!access) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = body as Record<string, unknown>;
  if (!Array.isArray(parsed?.nodes) || !Array.isArray(parsed?.edges)) {
    return Response.json({ error: "nodes and edges are required" }, { status: 400 });
  }

  const blob = await put(
    `canvas/${projectId}.json`,
    JSON.stringify({ nodes: parsed.nodes, edges: parsed.edges }),
    { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true }
  );

  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: blob.url },
  });

  return Response.json({ url: blob.url });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { projectId } = await params;

  const access = await checkAccess(projectId);
  if (!access) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  if (!project?.canvasJsonPath) {
    return new Response(null, { status: 204 });
  }

  const downloadUrl = getDownloadUrl(project.canvasJsonPath);
  const blobRes = await fetch(downloadUrl);
  if (!blobRes.ok) {
    return new Response(null, { status: 204 });
  }

  let canvas: unknown;
  try {
    canvas = await blobRes.json();
  } catch {
    return new Response(null, { status: 204 });
  }
  return Response.json(canvas);
}
