"use client"

import {
  Circle,
  Diamond,
  Hexagon,
  RectangleHorizontal,
  Cylinder,
  Pill,
} from "lucide-react"
import { Panel } from "@xyflow/react"
import type { CanvasShape } from "@/types/canvas"

export interface DragPayload {
  shape: CanvasShape
  width: number
  height: number
  dragOffsetX: number
  dragOffsetY: number
}

interface ShapeConfig {
  shape: CanvasShape
  label: string
  icon: React.ReactNode
  width: number
  height: number
}

const SHAPES: ShapeConfig[] = [
  { shape: "rectangle", label: "Rectangle", icon: <RectangleHorizontal size={18} />, width: 200, height: 80  },
  { shape: "diamond",   label: "Diamond",   icon: <Diamond size={18} />,             width: 140, height: 140 },
  { shape: "circle",    label: "Circle",    icon: <Circle size={18} />,              width: 100, height: 100 },
  { shape: "pill",      label: "Pill",      icon: <Pill size={18} />,               width: 180, height: 60  },
  { shape: "cylinder",  label: "Cylinder",  icon: <Cylinder size={18} />,           width: 100, height: 120 },
  { shape: "hexagon",   label: "Hexagon",   icon: <Hexagon size={18} />,            width: 120, height: 120 },
]

function getSvgPreviewMarkup(shape: CanvasShape, w: number, h: number, bg: string, stroke: string): string {
  const sw = 2
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 100 100" preserveAspectRatio="none">`
  if (shape === "diamond") {
    return `${open}<polygon points="50,4 96,50 50,96 4,50" fill="${bg}" stroke="${stroke}" stroke-width="${sw}"/></svg>`
  }
  if (shape === "hexagon") {
    return `${open}<polygon points="95,50 72,90 28,90 5,50 28,10 72,10" fill="${bg}" stroke="${stroke}" stroke-width="${sw}"/></svg>`
  }
  if (shape === "cylinder") {
    return `${open}
      <rect x="2" y="14" width="96" height="72" fill="${bg}"/>
      <ellipse cx="50" cy="86" rx="48" ry="12" fill="${bg}"/>
      <ellipse cx="50" cy="14" rx="48" ry="12" fill="${bg}"/>
      <line x1="2" y1="14" x2="2" y2="86" stroke="${stroke}" stroke-width="${sw}"/>
      <line x1="98" y1="14" x2="98" y2="86" stroke="${stroke}" stroke-width="${sw}"/>
      <ellipse cx="50" cy="86" rx="48" ry="12" fill="none" stroke="${stroke}" stroke-width="${sw}"/>
      <ellipse cx="50" cy="14" rx="48" ry="12" fill="none" stroke="${stroke}" stroke-width="${sw}"/>
    </svg>`
  }
  return `${open}</svg>`
}

function createDragPreview(shape: CanvasShape, width: number, height: number): HTMLElement {
  const scale = 0.75
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)

  const bg = getComputedStyle(document.documentElement).getPropertyValue("--color-surface").trim() || "#111114"
  const stroke = "#6366f1"

  const el = document.createElement("div")
  el.style.cssText = `position:fixed;top:-${h + 20}px;left:-${w + 20}px;width:${w}px;height:${h}px;opacity:0.8;pointer-events:none;box-sizing:border-box;`

  if (shape === "rectangle") {
    el.style.border = `2px solid ${stroke}`
    el.style.borderRadius = "6px"
    el.style.background = bg
  } else if (shape === "pill") {
    el.style.border = `2px solid ${stroke}`
    el.style.borderRadius = "9999px"
    el.style.background = bg
  } else if (shape === "circle") {
    el.style.border = `2px solid ${stroke}`
    el.style.borderRadius = "50%"
    el.style.background = bg
  } else {
    el.style.background = "transparent"
    el.innerHTML = getSvgPreviewMarkup(shape, w, h, bg, stroke)
  }

  return el
}

interface ShapeButtonProps extends ShapeConfig {
  onAdd: (shape: CanvasShape, width: number, height: number) => void
}

function ShapeButton({ shape, label, icon, width, height, onAdd }: ShapeButtonProps) {
  function onDragStart(event: React.DragEvent<HTMLButtonElement>) {
    // Hotspot is top-left of the scaled preview; the canvas drop handler adds
    // half the node dimensions to center the node at the drop cursor position.
    const dragOffsetX = 0
    const dragOffsetY = 0
    const payload: DragPayload = { shape, width, height, dragOffsetX, dragOffsetY }
    event.dataTransfer.setData("application/ghost-shape", JSON.stringify(payload))
    event.dataTransfer.effectAllowed = "copy"

    const preview = createDragPreview(shape, width, height)
    document.body.appendChild(preview)
    event.dataTransfer.setDragImage(preview, dragOffsetX, dragOffsetY)
    requestAnimationFrame(() => {
      if (preview.parentNode) preview.parentNode.removeChild(preview)
    })
  }

  return (
    <button
      draggable
      onDragStart={onDragStart}
      onClick={() => onAdd(shape, width, height)}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 cursor-grab items-center justify-center rounded-lg text-copy-secondary transition-colors hover:bg-accent-dim hover:text-copy-primary active:cursor-grabbing"
    >
      {icon}
    </button>
  )
}

interface ShapePanelProps {
  onAdd: (shape: CanvasShape, width: number, height: number) => void
}

export function ShapePanel({ onAdd }: ShapePanelProps) {
  return (
    <Panel position="bottom-center" className="mb-4">
      <div className="flex items-center gap-1 rounded-full border border-surface-border bg-surface/90 px-3 py-2 shadow-lg backdrop-blur-sm">
        {SHAPES.map((s) => (
          <ShapeButton key={s.shape} {...s} onAdd={onAdd} />
        ))}
      </div>
    </Panel>
  )
}
