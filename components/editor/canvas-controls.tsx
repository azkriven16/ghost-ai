"use client"

import { Maximize, Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react"
import { Panel, useReactFlow } from "@xyflow/react"
import { useCanRedo, useCanUndo, useRedo, useUndo } from "@liveblocks/react"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

function ControlButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-copy-secondary transition-colors hover:bg-accent-dim hover:text-copy-primary disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

export function CanvasControls() {
  const rf = useReactFlow()
  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  useKeyboardShortcuts({ instance: rf, undo, redo })

  return (
    <Panel position="bottom-left" className="mb-4 ml-4">
      <div className="flex items-center gap-1 rounded-full border border-surface-border bg-surface/90 px-3 py-2 shadow-lg backdrop-blur-sm">
        <ControlButton onClick={() => rf.zoomOut({ duration: 200 })} label="Zoom out">
          <ZoomOut size={16} />
        </ControlButton>
        <ControlButton onClick={() => rf.fitView({ duration: 200 })} label="Fit view">
          <Maximize size={16} />
        </ControlButton>
        <ControlButton onClick={() => rf.zoomIn({ duration: 200 })} label="Zoom in">
          <ZoomIn size={16} />
        </ControlButton>

        <div className="mx-1 h-4 w-px bg-surface-border" />

        <ControlButton onClick={undo} disabled={!canUndo} label="Undo">
          <Undo2 size={16} />
        </ControlButton>
        <ControlButton onClick={redo} disabled={!canRedo} label="Redo">
          <Redo2 size={16} />
        </ControlButton>
      </div>
    </Panel>
  )
}
