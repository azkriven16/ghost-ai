"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import type { CanvasNode } from "@/types/canvas"

const DEFAULT_BORDER = "#6366f1"

export function CanvasNodeRenderer({ data, selected }: NodeProps<CanvasNode>) {
  const borderColor = data.color ?? DEFAULT_BORDER

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <div
        className="flex h-full w-full items-center justify-center rounded-md px-3 py-2 text-sm text-copy-primary"
        style={{
          border: `2px solid ${borderColor}`,
          background: "var(--color-surface)",
          boxShadow: selected ? `0 0 0 2px ${borderColor}40` : undefined,
        }}
      >
        {data.label ? (
          <span className="truncate">{data.label}</span>
        ) : (
          <span className="text-xs text-copy-faint">…</span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />
    </>
  )
}
