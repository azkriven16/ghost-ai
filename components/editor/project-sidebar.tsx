"use client"

import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <div
      aria-hidden={!isOpen}
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

        <TabsContent value="my-projects" className="flex flex-1 items-center justify-center p-4">
          <p className="text-center text-sm text-copy-muted">No projects yet.</p>
        </TabsContent>

        <TabsContent value="shared" className="flex flex-1 items-center justify-center p-4">
          <p className="text-center text-sm text-copy-muted">No shared projects.</p>
        </TabsContent>
      </Tabs>

      <div className="shrink-0 border-t border-surface-border p-4">
        <Button className="w-full gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
  )
}
