"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEditorContext } from "./editor-context"

export function EditorHome() {
  const { openCreate } = useEditorContext()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-semibold text-copy-primary">
          Create a project or open an existing one
        </h1>
        <p className="max-w-sm text-sm text-copy-muted">
          Start a new architecture workspace, or choose a project from the sidebar.
        </p>
      </div>
      <Button onClick={openCreate} className="gap-2">
        <Plus className="h-4 w-4" />
        New Project
      </Button>
    </div>
  )
}
