"use client"

import type { RefObject } from "react"
import { useOthers } from "@liveblocks/react"
import { useReactFlow } from "@xyflow/react"

interface LiveCursorsProps {
  wrapperRef: RefObject<HTMLDivElement | null>
}

function CursorPointer({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="22"
      viewBox="0 0 16 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
    >
      <path d="M0 0L16 12L8.5 14L5.5 22L0 0Z" fill={color} />
    </svg>
  )
}

export function LiveCursors({ wrapperRef }: LiveCursorsProps) {
  const others = useOthers()
  const { flowToScreenPosition } = useReactFlow()

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {others.map((user) => {
        const cursor = user.presence.cursor
        if (!cursor) return null

        const screenPos = flowToScreenPosition({ x: cursor.x, y: cursor.y })
        const rect = wrapperRef.current?.getBoundingClientRect()
        if (!rect) return null

        const x = screenPos.x - rect.left
        const y = screenPos.y - rect.top
        const color = user.info?.cursorColor ?? "#00c8d4"
        const name = user.info?.name ?? "Anonymous"

        return (
          <div
            key={user.connectionId}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-2px, -2px)",
            }}
          >
            <CursorPointer color={color} />
            <span
              style={{
                backgroundColor: color,
                color: "#000000",
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: "9999px",
                marginLeft: "4px",
                display: "inline-block",
                whiteSpace: "nowrap",
                verticalAlign: "top",
                marginTop: "2px",
              }}
            >
              {name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
