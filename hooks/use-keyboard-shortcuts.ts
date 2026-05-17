"use client"

import { useEffect } from "react"

interface ZoomActions {
  zoomIn: (options?: { duration?: number }) => void
  zoomOut: (options?: { duration?: number }) => void
}

interface UseKeyboardShortcutsOptions {
  instance: ZoomActions | null
  undo: () => void
  redo: () => void
}

function isTypingTarget(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable
  )
}

export function useKeyboardShortcuts({ instance, undo, redo }: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e)) return

      const isMeta = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()

      if (!isMeta && (key === "+" || key === "=")) {
        e.preventDefault()
        instance?.zoomIn({ duration: 200 })
      } else if (!isMeta && key === "-") {
        e.preventDefault()
        instance?.zoomOut({ duration: 200 })
      } else if (isMeta && !e.shiftKey && key === "z") {
        e.preventDefault()
        undo()
      } else if (isMeta && e.shiftKey && key === "z") {
        e.preventDefault()
        redo()
      } else if (isMeta && key === "y") {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [instance, undo, redo])
}
