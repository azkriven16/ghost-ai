"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"

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

  const openCreate = useCallback(() => {
    const suffix = shortSuffix()
    setCreateDialog({ isOpen: true, name: "", roomId: `untitled-${suffix}`, suffix })
  }, [])

  const closeCreate = useCallback(() => {
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
    setIsLoading(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createDialog.name.trim() }),
      })
      if (!res.ok) return
      const data = await res.json()
      closeCreate()
      router.push(`/editor/${data.project.id}`)
    } finally {
      setIsLoading(false)
    }
  }, [createDialog.name, isLoading, closeCreate, router])

  const openRename = useCallback((project: Project) => {
    setRenameDialog({
      isOpen: true,
      projectId: project.id,
      currentName: project.name,
      newName: project.name,
    })
  }, [])

  const closeRename = useCallback(() => {
    setRenameDialog({ isOpen: false, projectId: null, currentName: "", newName: "" })
  }, [])

  const setRenameName = useCallback((newName: string) => {
    setRenameDialog((prev) => ({ ...prev, newName }))
  }, [])

  const handleRename = useCallback(async () => {
    const { projectId, newName } = renameDialog
    if (!projectId || !newName.trim() || isLoading) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) return
      closeRename()
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }, [renameDialog, isLoading, closeRename, router])

  const openDelete = useCallback((project: Project) => {
    setDeleteDialog({ isOpen: true, projectId: project.id, projectName: project.name })
  }, [])

  const closeDelete = useCallback(() => {
    setDeleteDialog({ isOpen: false, projectId: null, projectName: "" })
  }, [])

  const handleDelete = useCallback(async () => {
    const { projectId } = deleteDialog
    if (!projectId || isLoading) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
      if (!res.ok) return
      closeDelete()
      if (activeProjectId === projectId) {
        router.push("/editor")
      } else {
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }, [deleteDialog, isLoading, closeDelete, router, activeProjectId])

  return {
    createDialog,
    renameDialog,
    deleteDialog,
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
