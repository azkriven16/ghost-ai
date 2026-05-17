"use client"

import { Suspense, type RefObject } from "react"
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react"
import { Canvas, type CanvasHandle } from "./canvas"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"

interface CanvasProviderProps {
  roomId: string
  canvasRef?: RefObject<CanvasHandle | null> | null
  onSaveStatusChange?: (status: SaveStatus) => void
}

function LoadingCanvas() {
  return (
    <div className="flex flex-1 items-center justify-center bg-base">
      <p className="text-sm text-copy-faint">Connecting…</p>
    </div>
  )
}

function CanvasError() {
  return (
    <div className="flex flex-1 items-center justify-center bg-base">
      <p className="text-sm text-copy-faint">Failed to connect to canvas. Please refresh.</p>
    </div>
  )
}

export function CanvasProvider({ roomId, canvasRef, onSaveStatusChange }: CanvasProviderProps) {
  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        const res = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: room }),
        })
        if (!res.ok) throw new Error("Liveblocks auth failed")
        return res.json() as Promise<{ token: string }>
      }}
    >
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
      >
        <ClientSideSuspense fallback={<LoadingCanvas />}>
          <Suspense fallback={<LoadingCanvas />}>
            <Canvas
            ref={canvasRef ?? null}
            projectId={roomId}
            onSaveStatusChange={onSaveStatusChange ?? (() => {})}
          />
          </Suspense>
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
