"use client"

import { useCallback, useRef, useState } from "react"
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
import { AiSidebar } from "./ai-sidebar"
import { CanvasProvider } from "./canvas-provider"
import { StarterTemplatesModal } from "./starter-templates-modal"
import type { CanvasHandle } from "./canvas"
import type { CanvasTemplate } from "./starter-templates"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"

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
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")

  const canvasRef = useRef<CanvasHandle>(null)
  const handleSaveStatusChange = useCallback((s: SaveStatus) => setSaveStatus(s), [])
  const getCanvasData = useCallback(
    () => canvasRef.current?.getNodesAndEdges() ?? { nodes: [], edges: [] },
    []
  )

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

  function handleTemplateImport(template: CanvasTemplate) {
    canvasRef.current?.importTemplate(template.nodes, template.edges)
  }

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
          onOpenTemplates={() => setIsTemplatesOpen(true)}
          saveStatus={saveStatus}
          onSave={() => canvasRef.current?.save()}
          showUserButton={false}
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
          <div className="flex flex-1 min-h-0">
            <CanvasProvider
              roomId={projectId}
              canvasRef={canvasRef}
              onSaveStatusChange={handleSaveStatusChange}
            >
              <AiSidebar
                isOpen={isAiSidebarOpen}
                onClose={() => setIsAiSidebarOpen(false)}
                projectId={projectId}
                roomId={projectId}
                getCanvasData={getCanvasData}
              />
            </CanvasProvider>
          </div>
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
      <StarterTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onImport={handleTemplateImport}
      />
    </EditorContext.Provider>
  )
}
