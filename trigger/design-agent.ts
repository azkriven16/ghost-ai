import { task, logger } from "@trigger.dev/sdk";
import { generateText, Output, zodSchema } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { getLiveblocksClient } from "@/lib/liveblocks";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasShape } from "@/types/canvas";

const SHAPE_DEFAULTS: Record<string, { width: number; height: number }> = {
  rectangle: { width: 200, height: 80 },
  diamond: { width: 140, height: 140 },
  circle: { width: 100, height: 100 },
  pill: { width: 180, height: 60 },
  cylinder: { width: 100, height: 120 },
  hexagon: { width: 120, height: 120 },
};

const NodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  shape: z.enum(["rectangle", "circle", "diamond", "pill", "cylinder", "hexagon"]),
  colorIndex: z.number().int().min(0).max(7).default(0),
  x: z.number(),
  y: z.number(),
});

const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
});

const DesignSchema = z.object({
  nodes: z.array(NodeSchema).min(2).max(20),
  edges: z.array(EdgeSchema).max(30),
});

const SYSTEM_PROMPT = `You are a system architecture diagram assistant. Generate a visual architecture diagram based on the user's description.

SHAPE GUIDE:
- rectangle: APIs, services, components, microservices (most common)
- pill: containers, workers, processes, queues
- circle: events, triggers, endpoints, users
- cylinder: databases, caches, storage, data stores
- diamond: gateways, load balancers, routers, CDN
- hexagon: external systems, third-party services, cloud providers

COLOR GUIDE (colorIndex):
- 0: neutral grey (default)
- 1: blue (APIs, core services)
- 2: purple (platform, orchestration)
- 3: orange (messaging, events, queues)
- 4: red (external APIs, alerts)
- 5: pink (user-facing, frontend)
- 6: green (storage, databases, persistence)
- 7: teal (infrastructure, cloud)

LAYOUT RULES:
- x: 50 to 1200, y: 50 to 700
- Arrange left-to-right or top-to-bottom showing data flow
- Keep minimum 180px spacing between node centers
- Show clear hierarchy: clients > gateway > services > data stores

OUTPUT RULES:
- Generate 4-12 nodes for most architectures
- Labels: 1-4 words, title case (e.g., "API Gateway", "User Service", "Postgres DB")
- Node IDs: short kebab-case (e.g., "api-gw", "user-svc", "postgres")
- Edge IDs: "e1", "e2", etc.
- Edge labels: only for important flows — keep short`;

export const designAgent = task({
  id: "design-agent",
  retry: { maxAttempts: 2 },
  run: async (payload: { prompt: string; roomId: string }) => {
    const { prompt, roomId } = payload;
    const liveblocks = getLiveblocksClient();

    async function broadcastStatus(
      status: "thinking" | "generating" | "complete" | "error",
      message: string
    ) {
      try {
        await liveblocks.broadcastEvent(roomId, { type: "AI_STATUS", status, message });
      } catch (err) {
        logger.warn("Failed to broadcast status", { status, error: String(err) });
      }
    }

    logger.info("Design agent started", { roomId, promptLength: prompt.length });
    await broadcastStatus("thinking", "Reading your prompt…");

    const googleProvider = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    });

    let design: z.infer<typeof DesignSchema>;

    try {
      const { output } = await generateText({
        model: googleProvider("gemini-2.5-flash"),
        output: Output.object({ schema: zodSchema(DesignSchema) }),
        system: SYSTEM_PROMPT,
        prompt: `Design a system architecture for: ${prompt}`,
        maxRetries: 1,
      });
      design = output;
    } catch (err) {
      logger.error("AI generation failed", { error: String(err) });
      await broadcastStatus("error", "Generation failed. Please try again.");
      throw err;
    }

    await broadcastStatus("generating", `Building ${design.nodes.length} nodes…`);

    const nodes = design.nodes.map((n) => {
      const color = NODE_COLORS[n.colorIndex] ?? NODE_COLORS[0];
      const dims = SHAPE_DEFAULTS[n.shape] ?? { width: 200, height: 80 };
      return {
        id: n.id,
        type: "canvasNode" as const,
        position: { x: n.x, y: n.y },
        data: {
          label: n.label,
          shape: n.shape as CanvasShape,
          bgColor: color.bg,
          textColor: color.text,
        },
        style: { width: dims.width, height: dims.height },
      };
    });

    const edges = design.edges.map((e) => ({
      id: e.id,
      type: "canvasEdge" as const,
      source: e.source,
      target: e.target,
      sourceHandle: null,
      targetHandle: null,
      data: { label: e.label ?? "" },
    }));

    try {
      await liveblocks.broadcastEvent(roomId, {
        type: "AI_NODES_GENERATED",
        nodes,
        edges,
      });
    } catch (err) {
      logger.error("Failed to broadcast generated design", { error: String(err) });
      await broadcastStatus("error", "Failed to apply design. Please try again.");
      throw err;
    }

    await broadcastStatus(
      "complete",
      `Added ${nodes.length} nodes and ${edges.length} connections.`
    );

    logger.info("Design agent complete", { nodeCount: nodes.length, edgeCount: edges.length });
    return { nodeCount: nodes.length, edgeCount: edges.length };
  },
});
