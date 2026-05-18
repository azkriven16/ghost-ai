"use client"

import { useState, useLayoutEffect, type RefObject } from "react"
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
  const [rect, setRect] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    const updateRect = () => {
      setRect(wrapperRef.current?.getBoundingClientRect() ?? null)
    }
    updateRect()
    window.addEventListener("resize", updateRect)
    return () => window.removeEventListener("resize", updateRect)
  }, [wrapperRef])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {others.map((user) => {
        const cursor = user.presence.cursor
        if (!cursor) return null
        if (!rect) return null

        const screenPos = flowToScreenPosition({ x: cursor.x, y: cursor.y })
        const x = screenPos.x - rect.left
        const y = screenPos.y - rect.top
        const color = user.info?.cursorColor ?? "#00c8d4"
        const name = user.info?.name ?? "Anonymous"
        const isThinking = user.presence.thinking === true

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
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                whiteSpace: "nowrap",
                verticalAlign: "top",
                marginTop: "2px",
              }}
            >
              {isThinking && (
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    border: "1.5px solid #00000060",
                    borderTopColor: "#000000",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                    flexShrink: 0,
                  }}
                />
              )}
              {name}
            </span>
          </div>
        )
      })}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
