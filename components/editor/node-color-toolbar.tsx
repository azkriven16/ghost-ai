"use client"

import { NodeToolbar, Position } from "@xyflow/react"
import { NODE_COLORS, type NodeColorPair } from "@/types/canvas"

interface NodeColorToolbarProps {
  selected: boolean
  activeBg: string
  onSelect: (pair: NodeColorPair) => void
}

export function NodeColorToolbar({ selected, activeBg, onSelect }: NodeColorToolbarProps) {
  return (
    <NodeToolbar isVisible={selected} position={Position.Top} offset={8}>
      <div
        className="flex items-center gap-1.5 rounded-xl border border-surface-border bg-elevated px-2 py-1.5 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {NODE_COLORS.map((pair) => {
          const isActive = pair.bg === activeBg
          return (
            <button
              key={pair.bg}
              type="button"
              onClick={() => onSelect(pair)}
              title={pair.text}
              className="h-4 w-4 rounded-full transition-[box-shadow]"
              style={{
                background: pair.bg,
                outline: isActive ? `2px solid ${pair.text}` : "2px solid transparent",
                outlineOffset: "2px",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.boxShadow = `0 0 0 3px ${pair.text}40`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none"
              }}
            />
          )
        })}
      </div>
    </NodeToolbar>
  )
}
