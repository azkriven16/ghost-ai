import { auth as triggerAuth } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, canAccessProject } from "@/lib/project-access";
import { designAgent } from "@/trigger/design-agent";

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = body as Record<string, unknown>;
  const prompt = typeof parsed?.prompt === "string" ? parsed.prompt.trim() : "";
  const roomId = typeof parsed?.roomId === "string" ? parsed.roomId.trim() : "";
  const projectId =
    typeof parsed?.projectId === "string" ? parsed.projectId.trim() : "";

  if (!prompt || !roomId || !projectId) {
    return Response.json(
      { error: "prompt, roomId, and projectId are required" },
      { status: 400 }
    );
  }

  const hasAccess = await canAccessProject(projectId, identity);
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const handle = await designAgent.trigger({ prompt, roomId });

  await prisma.taskRun.create({
    data: { runId: handle.id, projectId, userId: identity.userId },
  });

  const publicToken = await triggerAuth.createPublicToken({
    scopes: { read: { runs: [handle.id] } },
    expirationTime: "1h",
  });

  return Response.json({ runId: handle.id, publicToken }, { status: 201 });
}
