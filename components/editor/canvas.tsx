"use client"

import { useCallback, useRef, forwardRef, useImperativeHandle } from "react"
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  MarkerType,
  type ReactFlowInstance,
  type Connection,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { CanvasNodeRenderer } from "./canvas-node"
import { CanvasEdgeRenderer } from "./canvas-edge"
import { CanvasControls } from "./canvas-controls"
import { ShapePanel, type DragPayload } from "./shape-panel"
import type { CanvasNode, CanvasEdge, CanvasShape } from "@/types/canvas"

import "@xyflow/react/dist/style.css"

export interface CanvasHandle {
  importTemplate: (nodes: CanvasNode[], edges: CanvasEdge[]) => void
}

const nodeTypes = { canvasNode: CanvasNodeRenderer }
const edgeTypes = { canvasEdge: CanvasEdgeRenderer }

const defaultEdgeOptions = {
  type: "canvasEdge",
  markerEnd: { type: MarkerType.ArrowClosed, color: "#f8fafc" },
}

const VALID_SHAPES: CanvasShape[] = ["rectangle", "circle", "diamond", "pill", "cylinder", "hexagon"]

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

export const Canvas = forwardRef<CanvasHandle>(function Canvas(_, ref) {
  const rfInstance = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true })

  useImperativeHandle(ref, () => ({
    importTemplate(templateNodes, templateEdges) {
      onNodesChange([
        ...nodes.map((n) => ({ type: "remove" as const, id: n.id })),
        ...templateNodes.map((n) => ({ type: "add" as const, item: n })),
      ])
      onEdgesChange([
        ...edges.map((e) => ({ type: "remove" as const, id: e.id })),
        ...templateEdges.map((e) => ({ type: "add" as const, item: e })),
      ])
      setTimeout(() => rfInstance.current?.fitView({ duration: 400 }), 50)
    },
  }), [nodes, edges, onNodesChange, onEdgesChange])

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

      const { x, y } = rfInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      onNodesChange([{ type: "add", item: makeNode(payload.shape, payload.width, payload.height, x, y) }])
    },
    [onNodesChange]
  )

  return (
    <div ref={wrapperRef} className="h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectOnClick={false}
        fitView
        onInit={(instance) => { rfInstance.current = instance }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <MiniMap />
        <CanvasControls />
        <ShapePanel onAdd={handleAddNode} />
      </ReactFlow>
    </div>
  )
})
