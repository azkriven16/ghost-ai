import { z } from "zod";
import { auth as triggerAuth } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, canAccessProject } from "@/lib/project-access";
import { generateSpec } from "@/trigger/generate-spec";
import { ChatMessageSchema } from "@/types/tasks";

const SpecNodeSchema = z.object({
  id: z.string(),
  data: z.object({
    label: z.string(),
    shape: z.string().optional(),
  }),
  position: z.object({ x: z.number(), y: z.number() }),
});

const SpecEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  data: z.object({ label: z.string().optional() }).optional(),
});

const RequestSchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z.array(ChatMessageSchema),
  nodes: z.array(SpecNodeSchema),
  edges: z.array(SpecEdgeSchema),
});

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

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { roomId, chatHistory, nodes, edges } = parsed.data;

  // roomId is the projectId — resolve access from it, not from client-supplied data
  const hasAccess = await canAccessProject(roomId, identity);
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const handle = await generateSpec.trigger({
    projectId: roomId,
    roomId,
    chatHistory,
    nodes,
    edges,
  });

  await prisma.taskRun.create({
    data: { runId: handle.id, projectId: roomId, userId: identity.userId },
  });

  const publicToken = await triggerAuth.createPublicToken({
    scopes: { read: { runs: [handle.id] } },
    expirationTime: "1h",
  });

  return Response.json({ runId: handle.id, publicToken }, { status: 201 });
}
