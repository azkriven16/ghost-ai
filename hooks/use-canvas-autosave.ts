"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

const DEBOUNCE_MS = 2000
const RESET_MS = 2000

export function useCanvasAutosave(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  projectId: string
): { status: SaveStatus; save: () => void } {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(false)

  // Stable refs so the manual save callback always sees latest data
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  nodesRef.current = nodes
  edgesRef.current = edges

  const performSave = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    setStatus("saving")
    fetch(`/api/projects/${projectId}/canvas`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes: nodesRef.current, edges: edgesRef.current }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Save failed")
        setStatus("saved")
        resetTimerRef.current = setTimeout(() => setStatus("idle"), RESET_MS)
      })
      .catch(() => {
        setStatus("error")
        resetTimerRef.current = setTimeout(() => setStatus("idle"), RESET_MS)
      })
  }, [projectId])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(performSave, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, projectId])

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [])

  return { status, save: performSave }
}
