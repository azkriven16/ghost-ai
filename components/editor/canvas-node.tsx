"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import type { CanvasNode, CanvasShape } from "@/types/canvas"

const DEFAULT_COLOR = "#6366f1"

function restColor(color: string) {
  return `${color}99`
}

function NodeLabel({ text }: { text: string }) {
  return text ? (
    <span className="pointer-events-none truncate text-sm text-copy-primary">{text}</span>
  ) : (
    <span className="pointer-events-none text-xs text-copy-faint">…</span>
  )
}

const CSS_SHAPES = new Set<CanvasShape>(["rectangle", "pill", "circle"])

function CssShapeNode({
  shape,
  color,
  selected,
  label,
}: {
  shape: "rectangle" | "pill" | "circle"
  color: string
  selected: boolean
  label: string
}) {
  const borderRadius = shape === "rectangle" ? "6px" : "9999px"
  return (
    <div
      className="flex h-full w-full items-center justify-center px-3 py-2"
      style={{
        border: `2px solid ${selected ? color : restColor(color)}`,
        background: "var(--color-surface)",
        borderRadius,
        boxShadow: selected ? `0 0 0 2px ${color}40` : undefined,
      }}
    >
      <NodeLabel text={label} />
    </div>
  )
}

function DiamondPath({ color, selected }: { color: string; selected: boolean }) {
  return (
    <polygon
      points="50,4 96,50 50,96 4,50"
      fill="var(--color-surface)"
      stroke={selected ? color : restColor(color)}
      strokeWidth={selected ? 2.5 : 2}
    />
  )
}

function HexagonPath({ color, selected }: { color: string; selected: boolean }) {
  // flat-top hexagon
  return (
    <polygon
      points="95,50 72,90 28,90 5,50 28,10 72,10"
      fill="var(--color-surface)"
      stroke={selected ? color : restColor(color)}
      strokeWidth={selected ? 2.5 : 2}
    />
  )
}

function CylinderPath({ color, selected }: { color: string; selected: boolean }) {
  const stroke = selected ? color : restColor(color)
  const sw = selected ? 2.5 : 2
  return (
    <>
      <rect x="2" y="14" width="96" height="72" fill="var(--color-surface)" />
      <ellipse cx="50" cy="86" rx="48" ry="12" fill="var(--color-surface)" />
      <ellipse cx="50" cy="14" rx="48" ry="12" fill="var(--color-surface)" />
      <line x1="2" y1="14" x2="2" y2="86" stroke={stroke} strokeWidth={sw} />
      <line x1="98" y1="14" x2="98" y2="86" stroke={stroke} strokeWidth={sw} />
      <ellipse cx="50" cy="86" rx="48" ry="12" fill="none" stroke={stroke} strokeWidth={sw} />
      <ellipse cx="50" cy="14" rx="48" ry="12" fill="none" stroke={stroke} strokeWidth={sw} />
    </>
  )
}

function SvgShapeNode({
  shape,
  color,
  selected,
  label,
}: {
  shape: "diamond" | "hexagon" | "cylinder"
  color: string
  selected: boolean
  label: string
}) {
  return (
    <div className="relative h-full w-full">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {shape === "diamond" && <DiamondPath color={color} selected={selected} />}
        {shape === "hexagon" && <HexagonPath color={color} selected={selected} />}
        {shape === "cylinder" && <CylinderPath color={color} selected={selected} />}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center px-3">
        <NodeLabel text={label} />
      </div>
    </div>
  )
}

export function CanvasNodeRenderer({ data, selected }: NodeProps<CanvasNode>) {
  const shape = data.shape ?? "rectangle"
  const color = data.color ?? DEFAULT_COLOR

  return (
    <>
      <Handle id="target-top" type="target" position={Position.Top} />
      <Handle id="target-left" type="target" position={Position.Left} />
      {CSS_SHAPES.has(shape) ? (
        <CssShapeNode
          shape={shape as "rectangle" | "pill" | "circle"}
          color={color}
          selected={!!selected}
          label={data.label}
        />
      ) : (
        <SvgShapeNode
          shape={shape as "diamond" | "hexagon" | "cylinder"}
          color={color}
          selected={!!selected}
          label={data.label}
        />
      )}
      <Handle id="source-bottom" type="source" position={Position.Bottom} />
      <Handle id="source-right" type="source" position={Position.Right} />
    </>
  )
}
