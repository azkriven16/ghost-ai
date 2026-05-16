"use client"

import { createContext, useContext } from "react"

interface EditorContextValue {
  openCreate: () => void
}

export const EditorContext = createContext<EditorContextValue | null>(null)

export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error("useEditorContext must be used within EditorShell")
  return ctx
}
