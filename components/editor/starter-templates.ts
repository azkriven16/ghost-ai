import { MarkerType } from "@xyflow/react"
import { NODE_COLORS, type CanvasShape, type CanvasNode, type CanvasEdge } from "@/types/canvas"

export interface CanvasTemplate {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

function n(
  id: string,
  label: string,
  shape: CanvasShape,
  colorIdx: number,
  x: number,
  y: number,
  w: number,
  h: number
): CanvasNode {
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: {
      label,
      shape,
      bgColor: NODE_COLORS[colorIdx].bg,
      textColor: NODE_COLORS[colorIdx].text,
    },
    style: { width: w, height: h },
  }
}

function e(source: string, target: string): CanvasEdge {
  return {
    id: `edge-${source}-${target}`,
    type: "canvasEdge",
    source,
    target,
    sourceHandle: null,
    targetHandle: null,
    markerEnd: { type: MarkerType.ArrowClosed },
    data: {},
  }
}

const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices Architecture",
  description: "API Gateway routing traffic to independent services backed by a shared database.",
  nodes: [
    n("gw",       "API Gateway",     "rectangle", 1, 160,   0, 180, 70),
    n("auth",     "Auth Service",    "rectangle", 2,   0, 140, 160, 70),
    n("users",    "User Service",    "rectangle", 6, 190, 140, 160, 70),
    n("products", "Product Service", "rectangle", 3, 380, 140, 160, 70),
    n("db",       "Database",        "cylinder",  0, 195, 270, 110, 110),
  ],
  edges: [
    e("gw", "auth"),
    e("gw", "users"),
    e("gw", "products"),
    e("users", "db"),
    e("products", "db"),
  ],
}

const cicd: CanvasTemplate = {
  id: "cicd",
  name: "CI/CD Pipeline",
  description: "A five-stage pipeline from source commit through to production deployment.",
  nodes: [
    n("source",  "Source",     "pill",      7,   0,  80, 120, 60),
    n("build",   "Build",      "rectangle", 1, 160,  80, 120, 60),
    n("test",    "Test",       "rectangle", 3, 320,  80, 120, 60),
    n("staging", "Staging",    "rectangle", 6, 480,  80, 130, 60),
    n("prod",    "Production", "rectangle", 5, 650,  80, 130, 60),
  ],
  edges: [
    e("source",  "build"),
    e("build",   "test"),
    e("test",    "staging"),
    e("staging", "prod"),
  ],
}

const eventDriven: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description: "Producers publish events to a central bus consumed by multiple downstream services.",
  nodes: [
    n("pa",  "Producer A", "rectangle", 2,   0,  55, 150, 65),
    n("pb",  "Producer B", "rectangle", 5,   0, 180, 150, 65),
    n("bus", "Event Bus",  "hexagon",   0, 235,  90, 130, 120),
    n("c1",  "Consumer 1", "rectangle", 1, 455,  20, 150, 65),
    n("c2",  "Consumer 2", "rectangle", 6, 455, 135, 150, 65),
    n("c3",  "Consumer 3", "rectangle", 7, 455, 250, 150, 65),
  ],
  edges: [
    e("pa",  "bus"),
    e("pb",  "bus"),
    e("bus", "c1"),
    e("bus", "c2"),
    e("bus", "c3"),
  ],
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [microservices, cicd, eventDriven]
