import { schemaTask, logger, metadata } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { put } from "@vercel/blob";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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

const PayloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(ChatMessageSchema),
  nodes: z.array(SpecNodeSchema),
  edges: z.array(SpecEdgeSchema),
});

const SYSTEM_PROMPT = `You are a senior software architect writing technical specification documents. Given a system architecture diagram and conversation context, produce a comprehensive Markdown specification.

Structure the output as:

# [System Name] — Technical Specification

## Overview
Brief description of the system and its purpose.

## Architecture Components
For each component: name, type, role, and responsibilities.

## Data Flow
How data moves between components. Reference the labelled connections.

## Design Decisions
Key architectural choices and trade-offs identified from the conversation.

## Implementation Notes
Practical considerations, dependencies, and deployment guidance.

Keep it concise but complete. Use Markdown headings, bullet lists, and code blocks where appropriate. Do not include placeholder text — only write what the diagram and conversation support.`;

function buildPrompt(
  nodes: z.infer<typeof SpecNodeSchema>[],
  edges: z.infer<typeof SpecEdgeSchema>[],
  chatHistory: z.infer<typeof ChatMessageSchema>[]
): string {
  const nodeList = nodes
    .map((n) => `- **${n.data.label}** (${n.data.shape ?? "rectangle"}, id: \`${n.id}\`)`)
    .join("\n");

  const edgeList = edges
    .map((e) => {
      const from = nodes.find((n) => n.id === e.source)?.data.label ?? e.source;
      const to = nodes.find((n) => n.id === e.target)?.data.label ?? e.target;
      const label = e.data?.label ? ` [${e.data.label}]` : "";
      return `- ${from} → ${to}${label}`;
    })
    .join("\n");

  const conversation = chatHistory
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => `**${m.role === "user" ? "User" : "AI"}:** ${m.content}`)
    .join("\n\n");

  return `## Architecture Diagram

### Components (${nodes.length} nodes)
${nodeList || "_(empty canvas)_"}

### Connections (${edges.length} edges)
${edgeList || "_(no connections)_"}

## Conversation Context
${conversation || "_(no conversation history)_"}

Generate a technical specification for this architecture.`;
}

export const generateSpec = schemaTask({
  id: "generate-spec",
  schema: PayloadSchema,
  retry: { maxAttempts: 2 },
  run: async (payload, { ctx }) => {
    const { projectId, roomId, chatHistory, nodes, edges } = payload;

    logger.info("Spec generation started", {
      projectId,
      roomId,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      historyLength: chatHistory.length,
    });

    metadata.set("status", "starting").set("progress", 0);

    const googleProvider = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    });

    metadata.set("status", "generating").set("progress", 30);

    const prompt = buildPrompt(nodes, edges, chatHistory);

    let spec: string;

    try {
      metadata.set("progress", 50);

      const { text } = await generateText({
        model: googleProvider("gemini-2.5-flash"),
        system: SYSTEM_PROMPT,
        prompt,
        maxRetries: 1,
      });

      spec = text;
    } catch (err) {
      logger.error("Spec generation failed", { error: String(err) });
      metadata.set("status", "error").set("progress", 0);
      throw err;
    }

    metadata.set("status", "saving").set("progress", 80);

    const blob = await put(
      `specs/${projectId}/${ctx.run.id}.md`,
      spec,
      { access: "private", contentType: "text/markdown; charset=utf-8", addRandomSuffix: false }
    );

    const specRecord = await prisma.projectSpec.create({
      data: { projectId, filePath: blob.url },
    });

    metadata.set("status", "complete").set("progress", 100);

    logger.info("Spec generation complete", {
      projectId,
      specId: specRecord.id,
      specLength: spec.length,
    });

    return { spec, specId: specRecord.id };
  },
});
