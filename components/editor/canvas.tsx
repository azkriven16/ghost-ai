"use client"

import { useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { useRoom, useUpdateMyPresence, useEventListener } from "@liveblocks/react"
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  MarkerType,
  ConnectionMode,
  type ReactFlowInstance,
  type Connection,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { CanvasNodeRenderer } from "./canvas-node"
import { CanvasEdgeRenderer } from "./canvas-edge"
import { CanvasControls } from "./canvas-controls"
import { ShapePanel, type DragPayload } from "./shape-panel"
import { LiveCursors } from "./live-cursors"
import { PresenceAvatars } from "./presence-avatars"
import { useCanvasAutosave, type SaveStatus } from "@/hooks/use-canvas-autosave"
import type { CanvasNode, CanvasEdge, CanvasShape } from "@/types/canvas"

import "@xyflow/react/dist/style.css"

export interface CanvasHandle {
  importTemplate: (nodes: CanvasNode[], edges: CanvasEdge[]) => void
  save: () => void
  getNodesAndEdges: () => { nodes: CanvasNode[]; edges: CanvasEdge[] }
}

interface CanvasProps {
  projectId: string
  onSaveStatusChange: (status: SaveStatus) => void
}

const nodeTypes = { canvasNode: CanvasNodeRenderer }
const edgeTypes = { canvasEdge: CanvasEdgeRenderer }

const defaultEdgeOptions = {
  type: "canvasEdge",
  markerEnd: { type: MarkerType.ArrowClosed, color: "#f8fafc" },
}

const VALID_SHAPES: CanvasShape[] = ["rectangle", "circle", "diamond", "pill", "cylinder", "hexagon"]

interface SavedCanvas {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

function makeNode(shape: CanvasShape, width: number, height: number, x: number, y: number): CanvasNode {
  const id = `${shape}-${crypto.randomUUID()}`
  return {
    id,
    type: "canvasNode",
    position: { x: x - width / 2, y: y - height / 2 },
    data: { label: "", shape },
    style: { width, height },
  }
}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(
  function Canvas({ projectId, onSaveStatusChange }, ref) {
    const rfInstance = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const loadAttemptedRef = useRef(false)

    const room = useRoom()
    const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
      useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true })
    const updateMyPresence = useUpdateMyPresence()

    const { status: saveStatus, save: triggerSave } = useCanvasAutosave(nodes, edges, projectId)

    useEffect(() => {
      onSaveStatusChange(saveStatus)
    }, [saveStatus, onSaveStatusChange])

    useEventListener(({ event }) => {
      if (event.type === "AI_NODES_GENERATED") {
        room.history.pause()
        onNodesChange(event.nodes.map((n) => ({ type: "add" as const, item: n as CanvasNode })))
        onEdgesChange(event.edges.map((e) => ({ type: "add" as const, item: e as CanvasEdge })))
        room.history.resume()
        setTimeout(() => rfInstance.current?.fitView({ duration: 400 }), 50)
      }
    })

    // Load saved canvas once on mount if the room is empty
    useEffect(() => {
      if (loadAttemptedRef.current) return
      loadAttemptedRef.current = true

      if (nodes.length > 0 || edges.length > 0) return

      fetch(`/api/projects/${projectId}/canvas`)
        .then((res) => {
          if (res.status === 204) return null
          if (!res.ok) return null
          return res.json() as Promise<SavedCanvas>
        })
        .then((data) => {
          if (!data) return
          const { nodes: saved, edges: savedEdges } = data
          if (!saved?.length && !savedEdges?.length) return
          room.history.pause()
          onNodesChange(saved.map((n) => ({ type: "add" as const, item: n })))
          onEdgesChange(savedEdges.map((e) => ({ type: "add" as const, item: e })))
          room.history.resume()
          setTimeout(() => rfInstance.current?.fitView({ duration: 400 }), 50)
        })
        .catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.error("Failed to load saved canvas:", err)
          }
        })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useImperativeHandle(ref, () => ({
      importTemplate(templateNodes, templateEdges) {
        room.history.pause()
        onNodesChange([
          ...nodes.map((n) => ({ type: "remove" as const, id: n.id })),
          ...templateNodes.map((n) => ({ type: "add" as const, item: n })),
        ])
        onEdgesChange([
          ...edges.map((e) => ({ type: "remove" as const, id: e.id })),
          ...templateEdges.map((e) => ({ type: "add" as const, item: e })),
        ])
        room.history.resume()
        setTimeout(() => rfInstance.current?.fitView({ duration: 400 }), 50)
      },
      save: triggerSave,
      getNodesAndEdges: () => ({ nodes, edges }),
    }), [room, nodes, edges, onNodesChange, onEdgesChange, triggerSave])

    const getCanvasCenter = useCallback(() => {
      if (!rfInstance.current || !wrapperRef.current) return { x: 0, y: 0 }
      const rect = wrapperRef.current.getBoundingClientRect()
      return rfInstance.current.screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
    }, [])

    const handleAddNode = useCallback(
      (shape: CanvasShape, width: number, height: number) => {
        const { x, y } = getCanvasCenter()
        onNodesChange([{ type: "add", item: makeNode(shape, width, height, x, y) }])
      },
      [getCanvasCenter, onNodesChange]
    )

    const handleConnect = useCallback(
      (connection: Connection) => {
        onEdgesChange([{
          type: "add",
          item: {
            id: `edge-${crypto.randomUUID()}`,
            type: "canvasEdge",
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle ?? null,
            targetHandle: connection.targetHandle ?? null,
            data: {},
          },
        }])
      },
      [onEdgesChange]
    )

    const handleMouseMove = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (!rfInstance.current) return
        const pos = rfInstance.current.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })
        updateMyPresence({ cursor: { x: pos.x, y: pos.y } })
      },
      [updateMyPresence]
    )

    const handleMouseLeave = useCallback(() => {
      updateMyPresence({ cursor: null })
    }, [updateMyPresence])

    // Stable ref so the keydown effect never re-registers when Liveblocks
    // rotates the onDelete reference.
    const onDeleteRef = useRef(onDelete)
    onDeleteRef.current = onDelete

    // Use rfInstance.current.getNodes/getEdges() to read React Flow's live
    // selected state — Liveblocks does not persist the `selected` flag.
    // Route deletion through onDelete (the Liveblocks collaborative handler).
    useEffect(() => {
      function handleKeyDown(event: KeyboardEvent) {
        if (event.key !== "Delete" && event.key !== "Backspace") return
        const target = event.target as HTMLElement
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) return

        const rf = rfInstance.current
        if (!rf) return

        const selectedNodes = rf.getNodes().filter((n) => n.selected)
        const selectedEdges = rf.getEdges().filter((e) => e.selected)
        if (selectedNodes.length === 0 && selectedEdges.length === 0) return

        event.preventDefault()
        onDeleteRef.current({ nodes: selectedNodes, edges: selectedEdges })
      }

      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }, [])

    const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = "copy"
    }, [])

    const onDrop = useCallback(
      (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        if (!rfInstance.current) return

        const raw = event.dataTransfer.getData("application/ghost-shape")
        if (!raw) return

        let payload: DragPayload
        try {
          payload = JSON.parse(raw) as DragPayload
        } catch {
          return
        }

        if (
          !VALID_SHAPES.includes(payload.shape) ||
          !Number.isFinite(payload.width) ||
          !Number.isFinite(payload.height) ||
          payload.width <= 0 ||
          payload.height <= 0
        ) return

        // Use cursor position directly; dragOffsetX/Y are the hotspot offsets within
        // the drag preview (center of the scaled preview = center of node).
        // screenToFlowPosition converts cursor screen coords to flow coords.
        // makeNode centers the node at (x, y) in flow space.
        const { x, y } = rfInstance.current.screenToFlowPosition({
          x: event.clientX - (payload.dragOffsetX ?? 0),
          y: event.clientY - (payload.dragOffsetY ?? 0),
        })

        onNodesChange([{
          type: "add",
          item: makeNode(payload.shape, payload.width, payload.height, x, y),
        }])
      },
      [onNodesChange]
    )

    return (
      <div
        ref={wrapperRef}
        className="h-full w-full"
        onDragOver={onDragOver}
        onDrop={onDrop}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionMode={ConnectionMode.Loose}
          connectOnClick={false}
          deleteKeyCode={null}
          onInit={(instance) => { rfInstance.current = instance }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <MiniMap />
          <CanvasControls />
          <ShapePanel onAdd={handleAddNode} />
          <LiveCursors wrapperRef={wrapperRef} />
          <PresenceAvatars />
        </ReactFlow>
      </div>
    )
  }
)
