"use client"

import { useState, useCallback } from "react"

export interface Project {
  id: string
  name: string
  slug: string
  isOwned: boolean
}

export const MOCK_PROJECTS: Project[] = [
  { id: "1", name: "E-Commerce Platform", slug: "e-commerce-platform", isOwned: true },
  { id: "2", name: "Auth Service", slug: "auth-service", isOwned: true },
  { id: "3", name: "Shared API Design", slug: "shared-api-design", isOwned: false },
]

function toSlug(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  return slug || "untitled"
}

interface CreateDialogState {
  isOpen: boolean
  name: string
  slug: string
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

export function useProjectDialogs() {
  const [createDialog, setCreateDialog] = useState<CreateDialogState>({
    isOpen: false,
    name: "",
    slug: "",
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

  const isLoading = false

  const openCreate = useCallback(() => {
    setCreateDialog({ isOpen: true, name: "", slug: "" })
  }, [])

  const closeCreate = useCallback(() => {
    setCreateDialog({ isOpen: false, name: "", slug: "" })
  }, [])

  const setCreateName = useCallback((name: string) => {
    setCreateDialog((prev) => ({ ...prev, name, slug: toSlug(name) }))
  }, [])

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

  const openDelete = useCallback((project: Project) => {
    setDeleteDialog({ isOpen: true, projectId: project.id, projectName: project.name })
  }, [])

  const closeDelete = useCallback(() => {
    setDeleteDialog({ isOpen: false, projectId: null, projectName: "" })
  }, [])

  // isLoading is wired for future async persistence — stubs close immediately
  const handleCreate = useCallback(() => {
    closeCreate()
  }, [closeCreate])

  const handleRename = useCallback(() => {
    closeRename()
  }, [closeRename])

  const handleDelete = useCallback(() => {
    closeDelete()
  }, [closeDelete])

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
