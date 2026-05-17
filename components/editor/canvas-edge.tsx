"use client"

import { useRef, useState } from "react"
import { EdgeLabelRenderer, getSmoothStepPath, useReactFlow, type EdgeProps } from "@xyflow/react"
import type { CanvasEdge } from "@/types/canvas"

const STROKE_REST = "#f8fafc60"
const STROKE_ACTIVE = "#f8fafc"

export function CanvasEdgeRenderer({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeData } = useReactFlow()
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const cancelBlurRef = useRef(false)

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  const label = data?.label ?? ""
  const isActive = !!selected || isHovered
  const stroke = isActive ? STROKE_ACTIVE : STROKE_REST

  function startEdit() {
    setDraft(label)
    setIsEditing(true)
  }

  function commitEdit() {
    updateEdgeData(id, { label: draft.trim() })
    setIsEditing(false)
  }

  const edgeHandlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    onDoubleClick: startEdit,
  }

  return (
    <>
      {/* Visible path */}
      <path
        d={edgePath}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        markerEnd={markerEnd}
        style={{ transition: "stroke 0.15s" }}
      />
      {/* Wide invisible path for easier hover/click */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: "pointer" }}
        {...edgeHandlers}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          {...edgeHandlers}
        >
          {isEditing ? (
            <input
              autoFocus
              value={draft}
              size={Math.max(draft.length + 1, 6)}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                if (cancelBlurRef.current) { cancelBlurRef.current = false; return }
                commitEdit()
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") { e.preventDefault(); cancelBlurRef.current = true; setIsEditing(false) }
                if (e.key === "Enter") { e.preventDefault(); commitEdit() }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-full border border-surface-border bg-elevated px-2 py-0.5 text-center text-xs text-copy-primary focus:outline-none"
            />
          ) : label ? (
            <div className="cursor-default select-none rounded-full border border-surface-border bg-elevated px-2 py-0.5 text-xs text-copy-secondary">
              {label}
            </div>
          ) : isActive ? (
            <div className="cursor-text select-none text-xs text-copy-faint opacity-50">
              label
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
