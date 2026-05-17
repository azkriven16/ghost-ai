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

interface ShapeButtonProps extends ShapeConfig {
  onAdd: (shape: CanvasShape, width: number, height: number) => void
}

function ShapeButton({ shape, label, icon, width, height, onAdd }: ShapeButtonProps) {
  function onDragStart(event: React.DragEvent<HTMLButtonElement>) {
    const payload: DragPayload = { shape, width, height }
    event.dataTransfer.setData("application/ghost-shape", JSON.stringify(payload))
    event.dataTransfer.effectAllowed = "copy"
  }

  return (
    <button
      draggable
      onDragStart={onDragStart}
      onClick={() => onAdd(shape, width, height)}
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
