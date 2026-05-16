"use client"

import { X, Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type Project } from "@/hooks/use-project-dialogs"

interface ProjectSidebarProps {
  isOpen: boolean
  projects: Project[]
  onClose: () => void
  onNewProject: () => void
  onRenameProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

export function ProjectSidebar({
  isOpen,
  projects,
  onClose,
  onNewProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  const myProjects = projects.filter((p) => p.isOwned)
  const sharedProjects = projects.filter((p) => !p.isOwned)

  return (
    <>
      {/* Mobile backdrop scrim */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 sm:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      <div
        aria-hidden={isOpen ? "false" : "true"}
        inert={!isOpen || undefined}
        className={`fixed left-0 top-12 z-40 flex h-[calc(100dvh-3rem)] w-72 flex-col border-r border-surface-border bg-surface/90 backdrop-blur-sm transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-surface-border px-4 py-3">
          <span className="text-sm font-medium text-copy-primary">Projects</span>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="my-projects" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-4 mt-3 shrink-0">
            <TabsTrigger value="my-projects" className="flex-1">My Projects</TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">Shared</TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects" className="min-h-0 flex-1 p-0">
            {myProjects.length === 0 ? (
              <div className="flex h-full items-center justify-center p-4">
                <p className="text-center text-sm text-copy-muted">No projects yet.</p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <ul className="p-2">
                  {myProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      onRename={() => onRenameProject(project)}
                      onDelete={() => onDeleteProject(project)}
                    />
                  ))}
                </ul>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="shared" className="min-h-0 flex-1 p-0">
            {sharedProjects.length === 0 ? (
              <div className="flex h-full items-center justify-center p-4">
                <p className="text-center text-sm text-copy-muted">No shared projects.</p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <ul className="p-2">
                  {sharedProjects.map((project) => (
                    <ProjectItem key={project.id} project={project} />
                  ))}
                </ul>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <div className="shrink-0 border-t border-surface-border p-4">
          <Button className="w-full gap-2" onClick={onNewProject}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>
    </>
  )
}

interface ProjectItemProps {
  project: Project
  onRename?: () => void
  onDelete?: () => void
}

function ProjectItem({ project, onRename, onDelete }: ProjectItemProps) {
  return (
    <li className="group flex items-center justify-between rounded-xl px-3 py-2 hover:bg-elevated">
      <span className="truncate text-sm text-copy-primary">{project.name}</span>
      {project.isOwned && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={`Rename ${project.name}`}
            onClick={onRename}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-state-error"
            aria-label={`Delete ${project.name}`}
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </li>
  )
}
