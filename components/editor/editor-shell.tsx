"use client"

import { useState } from "react"
import { EditorNavbar } from "./editor-navbar"
import { ProjectSidebar } from "./project-sidebar"
import { EditorContext } from "./editor-context"
import { useProjectActions, type Project } from "@/hooks/use-project-actions"
import {
  CreateProjectDialog,
  RenameProjectDialog,
  DeleteProjectDialog,
} from "./project-dialogs"

interface EditorShellProps {
  children: React.ReactNode
  ownedProjects: Project[]
  sharedProjects: Project[]
}

export function EditorShell({ children, ownedProjects, sharedProjects }: EditorShellProps) {
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
  } = useProjectActions()

  return (
    <EditorContext.Provider value={{ openCreate }}>
      <div className="flex h-full flex-col">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
        />
        <ProjectSidebar
          isOpen={isSidebarOpen}
          projects={[...ownedProjects, ...sharedProjects]}
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
        roomId={createDialog.roomId}
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
