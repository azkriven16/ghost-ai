"use client"

import { useState } from "react"
import { EditorNavbar } from "./editor-navbar"
import { ProjectSidebar } from "./project-sidebar"
import { EditorContext } from "./editor-context"
import { useProjectDialogs, MOCK_PROJECTS } from "@/hooks/use-project-dialogs"
import {
  CreateProjectDialog,
  RenameProjectDialog,
  DeleteProjectDialog,
} from "./project-dialogs"

export function EditorShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const {
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
  } = useProjectDialogs()

  return (
    <EditorContext.Provider value={{ openCreate }}>
      <div className="flex h-full flex-col">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
        />
        <ProjectSidebar
          isOpen={isSidebarOpen}
          projects={MOCK_PROJECTS}
          onClose={() => setIsSidebarOpen(false)}
          onNewProject={openCreate}
          onRenameProject={openRename}
          onDeleteProject={openDelete}
        />
        <main className="relative flex-1 bg-base">{children}</main>
      </div>

      <CreateProjectDialog
        isOpen={createDialog.isOpen}
        name={createDialog.name}
        slug={createDialog.slug}
        isLoading={isLoading}
        onClose={closeCreate}
        onNameChange={setCreateName}
        onConfirm={handleCreate}
      />
      <RenameProjectDialog
        isOpen={renameDialog.isOpen}
        currentName={renameDialog.currentName}
        newName={renameDialog.newName}
        isLoading={isLoading}
        onClose={closeRename}
        onNameChange={setRenameName}
        onConfirm={handleRename}
      />
      <DeleteProjectDialog
        isOpen={deleteDialog.isOpen}
        projectName={deleteDialog.projectName}
        isLoading={isLoading}
        onClose={closeDelete}
        onConfirm={handleDelete}
      />
    </EditorContext.Provider>
  )
}
