"use client"

import { useRef, useState } from "react"
import { Handle, NodeResizer, Position, useNodeId, useReactFlow, type NodeProps } from "@xyflow/react"
import { NodeColorToolbar } from "./node-color-toolbar"
import { NODE_COLORS, type CanvasNode, type CanvasShape, type NodeColorPair } from "@/types/canvas"

const DEFAULT_COLOR = "#6366f1"
const DEFAULT_BG = NODE_COLORS[0].bg
const DEFAULT_TEXT = NODE_COLORS[0].text

const SHAPE_MIN: Record<CanvasShape, { width: number; height: number }> = {
  rectangle: { width: 80,  height: 40 },
  pill:      { width: 80,  height: 30 },
  circle:    { width: 40,  height: 40 },
  diamond:   { width: 60,  height: 60 },
  hexagon:   { width: 60,  height: 60 },
  cylinder:  { width: 60,  height: 60 },
}

function restColor(color: string) {
  return `${color}99`
}

function NodeLabel({ text, textColor }: { text: string; textColor: string }) {
  return text ? (
    <span className="pointer-events-none truncate text-sm" style={{ color: textColor }}>{text}</span>
  ) : (
    <span className="pointer-events-none text-xs" style={{ color: textColor, opacity: 0.4 }}>…</span>
  )
}

const CSS_SHAPES = new Set<CanvasShape>(["rectangle", "pill", "circle"])

function CssShapeNode({
  shape,
  color,
  bgColor,
  textColor,
  selected,
  label,
  onDoubleClick,
  editOverlay,
}: {
  shape: "rectangle" | "pill" | "circle"
  color: string
  bgColor: string
  textColor: string
  selected: boolean
  label: string
  onDoubleClick: (e: React.MouseEvent) => void
  editOverlay: React.ReactNode
}) {
  const borderRadius = shape === "rectangle" ? "6px" : "9999px"
  return (
    <div
      className="relative flex h-full w-full items-center justify-center px-3 py-2"
      onDoubleClick={onDoubleClick}
      style={{
        border: `2px solid ${selected ? color : restColor(color)}`,
        background: bgColor,
        borderRadius,
        boxShadow: selected ? `0 0 0 2px ${color}40` : undefined,
      }}
    >
      <NodeLabel text={label} textColor={textColor} />
      {editOverlay}
    </div>
  )
}

function DiamondPath({ fill, stroke, sw }: { fill: string; stroke: string; sw: number }) {
  return <polygon points="50,4 96,50 50,96 4,50" fill={fill} stroke={stroke} strokeWidth={sw} />
}

function HexagonPath({ fill, stroke, sw }: { fill: string; stroke: string; sw: number }) {
  return <polygon points="95,50 72,90 28,90 5,50 28,10 72,10" fill={fill} stroke={stroke} strokeWidth={sw} />
}

function CylinderPath({ fill, stroke, sw }: { fill: string; stroke: string; sw: number }) {
  return (
    <>
      <rect x="2" y="14" width="96" height="72" fill={fill} />
      <ellipse cx="50" cy="86" rx="48" ry="12" fill={fill} />
      <ellipse cx="50" cy="14" rx="48" ry="12" fill={fill} />
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
  bgColor,
  textColor,
  selected,
  label,
  onDoubleClick,
  editOverlay,
}: {
  shape: "diamond" | "hexagon" | "cylinder"
  color: string
  bgColor: string
  textColor: string
  selected: boolean
  label: string
  onDoubleClick: (e: React.MouseEvent) => void
  editOverlay: React.ReactNode
}) {
  const stroke = selected ? color : restColor(color)
  const sw = selected ? 2.5 : 2
  return (
    <div className="relative h-full w-full" onDoubleClick={onDoubleClick}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {shape === "diamond" && <DiamondPath fill={bgColor} stroke={stroke} sw={sw} />}
        {shape === "hexagon" && <HexagonPath fill={bgColor} stroke={stroke} sw={sw} />}
        {shape === "cylinder" && <CylinderPath fill={bgColor} stroke={stroke} sw={sw} />}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center px-3">
        <NodeLabel text={label} textColor={textColor} />
      </div>
      {editOverlay}
    </div>
  )
}

export function CanvasNodeRenderer({ data, selected }: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow()
  const nodeId = useNodeId() ?? ""
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const ignoreBlurRef = useRef(false)

  const shape = data.shape ?? "rectangle"
  const color = data.color ?? DEFAULT_COLOR
  const bgColor = data.bgColor ?? DEFAULT_BG
  const textColor = data.textColor ?? DEFAULT_TEXT
  const min = SHAPE_MIN[shape]

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setDraft(data.label)
    setIsEditing(true)
  }

  function commitEdit() {
    updateNodeData(nodeId, { label: draft.trim() })
    setIsEditing(false)
  }

  function handleColorSelect(pair: NodeColorPair) {
    updateNodeData(nodeId, { bgColor: pair.bg, textColor: pair.text })
  }

  const editOverlay = isEditing ? (
    <textarea
      autoFocus
      rows={1}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (ignoreBlurRef.current) { ignoreBlurRef.current = false; return }
        commitEdit()
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") { e.stopPropagation(); ignoreBlurRef.current = true; setIsEditing(false) }
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit() }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute left-0 right-0 resize-none bg-transparent text-center text-sm focus:outline-none"
      style={{
        top: "50%",
        transform: "translateY(-50%)",
        width: "100%",
        padding: "0 12px",
        border: "none",
        lineHeight: 1.25,
        boxSizing: "border-box",
        color: textColor,
      }}
    />
  ) : null

  return (
    <>
      <NodeColorToolbar selected={!!selected} activeBg={bgColor} onSelect={handleColorSelect} />
      <NodeResizer
        isVisible={!!selected}
        minWidth={min.width}
        minHeight={min.height}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: color,
          border: "1px solid var(--color-surface)",
        }}
        lineStyle={{ borderColor: `${color}55` }}
      />
      <Handle id="target-top" type="target" position={Position.Top} className="canvas-handle" />
      <Handle id="target-left" type="target" position={Position.Left} className="canvas-handle" />
      {CSS_SHAPES.has(shape) ? (
        <CssShapeNode
          shape={shape as "rectangle" | "pill" | "circle"}
          color={color}
          bgColor={bgColor}
          textColor={textColor}
          selected={!!selected}
          label={data.label}
          onDoubleClick={startEdit}
          editOverlay={editOverlay}
        />
      ) : (
        <SvgShapeNode
          shape={shape as "diamond" | "hexagon" | "cylinder"}
          color={color}
          bgColor={bgColor}
          textColor={textColor}
          selected={!!selected}
          label={data.label}
          onDoubleClick={startEdit}
          editOverlay={editOverlay}
        />
      )}
      <Handle id="source-bottom" type="source" position={Position.Bottom} className="canvas-handle" />
      <Handle id="source-right" type="source" position={Position.Right} className="canvas-handle" />
    </>
  )
}
