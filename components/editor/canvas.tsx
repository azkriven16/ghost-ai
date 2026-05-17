"use client"

import { useCallback, useRef } from "react"
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  type ReactFlowInstance,
} from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { CanvasNodeRenderer } from "./canvas-node"
import { ShapePanel, type DragPayload } from "./shape-panel"
import type { CanvasNode, CanvasEdge, CanvasShape } from "@/types/canvas"

import "@xyflow/react/dist/style.css"

const nodeTypes = { canvasNode: CanvasNodeRenderer }
const edgeTypes = {}

let nodeCounter = 0

function makeNode(shape: CanvasShape, width: number, height: number, x: number, y: number): CanvasNode {
  const id = `${shape}-${Date.now()}-${++nodeCounter}`
  return {
    id,
    type: "canvasNode",
    position: { x: x - width / 2, y: y - height / 2 },
    data: { label: "", shape },
    style: { width, height },
  }
}

export function Canvas() {
  const rfInstance = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true })

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
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectOnClick={false}
        fitView
        onInit={(instance) => { rfInstance.current = instance }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <MiniMap />
        <ShapePanel onAdd={handleAddNode} />
      </ReactFlow>
    </div>
  )
}
