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
import { ShareDialog } from "./share-dialog"

interface WorkspaceShellProps {
  projectId: string
  projectName: string
  ownedProjects: Project[]
  sharedProjects: Project[]
}

export function WorkspaceShell({
  projectId,
  projectName,
  ownedProjects,
  sharedProjects,
}: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)

  const {
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
  } = useProjectActions(projectId)

  return (
    <EditorContext.Provider value={{ openCreate }}>
      <div className="flex h-dvh flex-col">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
          projectName={projectName}
          isAiSidebarOpen={isAiSidebarOpen}
          onToggleAiSidebar={() => setIsAiSidebarOpen((v) => !v)}
          onShare={() => setIsShareOpen(true)}
        />
        <ProjectSidebar
          isOpen={isSidebarOpen}
          projects={[...ownedProjects, ...sharedProjects]}
          activeProjectId={projectId}
          onClose={() => setIsSidebarOpen(false)}
          onNewProject={openCreate}
          onRenameProject={openRename}
          onDeleteProject={openDelete}
        />
        <div className="relative flex flex-1 min-h-0">
          {/* Canvas placeholder */}
          <div className="flex flex-1 items-center justify-center bg-base">
            <p className="text-sm text-copy-faint">Canvas coming soon</p>
          </div>

          {/* AI sidebar */}
          <aside
            aria-hidden={isAiSidebarOpen ? "false" : "true"}
            inert={!isAiSidebarOpen || undefined}
            className={`fixed right-0 top-12 z-40 flex h-[calc(100dvh-3rem)] w-80 flex-col border-l border-surface-border bg-surface/90 backdrop-blur-sm transition-transform duration-200 ease-in-out ${
              isAiSidebarOpen
                ? "translate-x-0 pointer-events-auto"
                : "translate-x-full pointer-events-none"
            }`}
          >
            <div className="flex shrink-0 items-center border-b border-surface-border px-4 py-3">
              <span className="text-sm font-medium text-copy-primary">AI Assistant</span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-copy-faint">AI chat coming soon</p>
            </div>
          </aside>
        </div>
      </div>

      <CreateProjectDialog
        isOpen={createDialog.isOpen}
        name={createDialog.name}
        roomId={createDialog.roomId}
        isLoading={isLoading}
        createError={createError}
        onClose={closeCreate}
        onNameChange={setCreateName}
        onConfirm={handleCreate}
      />
      <RenameProjectDialog
        isOpen={renameDialog.isOpen}
        currentName={renameDialog.currentName}
        newName={renameDialog.newName}
        isLoading={isLoading}
        renameError={renameError}
        onClose={closeRename}
        onNameChange={setRenameName}
        onConfirm={handleRename}
      />
      <DeleteProjectDialog
        isOpen={deleteDialog.isOpen}
        projectName={deleteDialog.projectName}
        isLoading={isLoading}
        deleteError={deleteError}
        onClose={closeDelete}
        onConfirm={handleDelete}
      />
      <ShareDialog
        isOpen={isShareOpen}
        projectId={projectId}
        projectName={projectName}
        onClose={() => setIsShareOpen(false)}
      />
    </EditorContext.Provider>
  )
}
