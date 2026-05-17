"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"

interface CreateProjectResponse { project: { id: string } }

function isCreateProjectResponse(data: unknown): data is CreateProjectResponse {
  if (!data || typeof data !== "object") return false
  const project = (data as { project?: unknown }).project
  if (!project || typeof project !== "object") return false
  return typeof (project as { id?: unknown }).id === "string"
}

export interface Project {
  id: string
  name: string
  isOwned: boolean
}

function toSlug(name: string): string {
  return (
    name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled"
  )
}

function shortSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}

interface CreateDialogState {
  isOpen: boolean
  name: string
  roomId: string
  suffix: string
}

interface RenameDialogState {
  isOpen: boolean
  projectId: string | null
  currentName: string
  newName: string
}

interface DeleteDialogState {
  isOpen: boolean
  projectId: string | null
  projectName: string
}

export function useProjectActions(activeProjectId?: string) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [createDialog, setCreateDialog] = useState<CreateDialogState>({
    isOpen: false,
    name: "",
    roomId: "",
    suffix: "",
  })

  const [renameDialog, setRenameDialog] = useState<RenameDialogState>({
    isOpen: false,
    projectId: null,
    currentName: "",
    newName: "",
  })

  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    projectId: null,
    projectName: "",
  })
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined)
  const [createError, setCreateError] = useState<string | undefined>(undefined)
  const [renameError, setRenameError] = useState<string | undefined>(undefined)

  const openCreate = useCallback(() => {
    setCreateError(undefined)
    const suffix = shortSuffix()
    setCreateDialog({ isOpen: true, name: "", roomId: `untitled-${suffix}`, suffix })
  }, [])

  const closeCreate = useCallback(() => {
    setCreateError(undefined)
    setCreateDialog({ isOpen: false, name: "", roomId: "", suffix: "" })
  }, [])

  const setCreateName = useCallback((name: string) => {
    setCreateDialog((prev) => ({
      ...prev,
      name,
      roomId: name.trim() ? `${toSlug(name)}-${prev.suffix}` : `untitled-${prev.suffix}`,
    }))
  }, [])

  const handleCreate = useCallback(async () => {
    if (!createDialog.name.trim() || isLoading) return
    setCreateError(undefined)
    setIsLoading(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createDialog.name.trim() }),
      })
      if (!res.ok) {
        const errorText = await res.text().catch(() => "")
        const statusText = res.statusText ? ` ${res.statusText}` : ""
        const message = `Create failed: ${res.status}${statusText}${errorText ? ` — ${errorText}` : ""}`
        setCreateError(message)
        console.error("[useProjectActions] create failed", message)
        return
      }

      let data: unknown
      try {
        data = await res.json()
      } catch (err) {
        const message = `Create failed: invalid JSON response${
          err instanceof Error ? ` — ${err.message}` : ""
        }`
        setCreateError(message)
        console.error("[useProjectActions] create parse error", err)
        return
      }

      if (!isCreateProjectResponse(data)) {
        const message = "Create failed: unexpected server response."
        setCreateError(message)
        console.error("[useProjectActions] create invalid response", data)
        return
      }

      closeCreate()
      router.push(`/editor/${data.project.id}`)
    } catch (e) {
      const message = `Create failed: ${e instanceof Error ? e.message : String(e)}`
      setCreateError(message)
      console.error("[useProjectActions] create error", e)
    } finally {
      setIsLoading(false)
    }
  }, [createDialog.name, isLoading, closeCreate, router])

  const openRename = useCallback((project: Project) => {
    setRenameError(undefined)
    setRenameDialog({
      isOpen: true,
      projectId: project.id,
      currentName: project.name,
      newName: project.name,
    })
  }, [])

  const closeRename = useCallback(() => {
    setRenameError(undefined)
    setRenameDialog({ isOpen: false, projectId: null, currentName: "", newName: "" })
  }, [])

  const setRenameName = useCallback((newName: string) => {
    setRenameDialog((prev) => ({ ...prev, newName }))
  }, [])

  const handleRename = useCallback(async () => {
    const { projectId, newName } = renameDialog
    if (!projectId || !newName.trim() || isLoading) return
    setRenameError(undefined)
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) {
        const errorText = await res.text().catch(() => "")
        const statusText = res.statusText ? ` ${res.statusText}` : ""
        const message = `Rename failed: ${res.status}${statusText}${errorText ? ` — ${errorText}` : ""}`
        setRenameError(message)
        console.error("[useProjectActions] rename failed", message)
        return
      }
      setRenameError(undefined)
      closeRename()
      router.refresh()
    } catch (e) {
      const message = `Rename failed: ${e instanceof Error ? e.message : String(e)}`
      setRenameError(message)
      console.error("[useProjectActions] rename error", e)
    } finally {
      setIsLoading(false)
    }
  }, [renameDialog, isLoading, closeRename, router])

  const openDelete = useCallback((project: Project) => {
    setDeleteError(undefined)
    setDeleteDialog({ isOpen: true, projectId: project.id, projectName: project.name })
  }, [])

  const closeDelete = useCallback(() => {
    setDeleteError(undefined)
    setDeleteDialog({ isOpen: false, projectId: null, projectName: "" })
  }, [])

  const handleDelete = useCallback(async () => {
    const { projectId } = deleteDialog
    if (!projectId || isLoading) return
    setDeleteError(undefined)
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
      if (!res.ok) {
        const errorText = await res.text().catch(() => "")
        const statusText = res.statusText ? ` ${res.statusText}` : ""
        setDeleteError(
          `Delete failed: ${res.status}${statusText}${errorText ? ` — ${errorText}` : ""}`
        )
        return
      }
      setDeleteError(undefined)
      closeDelete()
      if (activeProjectId === projectId) {
        router.push("/editor")
      } else {
        router.refresh()
      }
    } catch (e) {
      setDeleteError(
        `Delete failed: ${e instanceof Error ? e.message : String(e)}`
      )
    } finally {
      setIsLoading(false)
    }
  }, [deleteDialog, isLoading, closeDelete, router, activeProjectId])

  return {
    createDialog,
    renameDialog,
    deleteDialog,
    createError,
    renameError,
    deleteError,
    isLoading,
    openCreate,
    closeCreate,
    setCreateName,
    openRename,
    closeRename,
    setRenameName,
    openDelete,
    closeDelete,
    handleCreate,
    handleRename,
    handleDelete,
  }
}
