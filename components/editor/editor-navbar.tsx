"use client"

import { LayoutTemplate, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Share2 } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"

const SAVE_BTN_LABEL: Record<SaveStatus, string> = {
  idle: "Save",
  saving: "Saving...",
  saved: "Saved",
  error: "Error",
}

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  projectName?: string
  onShare?: () => void
  onOpenTemplates?: () => void
  isAiSidebarOpen?: boolean
  onToggleAiSidebar?: () => void
  saveStatus?: SaveStatus
  onSave?: () => void
  showUserButton?: boolean
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName,
  onShare,
  onOpenTemplates,
  isAiSidebarOpen,
  onToggleAiSidebar,
  saveStatus,
  onSave,
  showUserButton = true,
}: EditorNavbarProps) {
  const saveBtnLabel = onSave ? SAVE_BTN_LABEL[saveStatus ?? "idle"] : null
  const isSaving = saveStatus === "saving"

  return (
    <header className="h-12 shrink-0 flex items-center px-3 bg-surface border-b border-surface-border">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-2">
        {projectName && (
          <span
            className="max-w-full truncate text-sm font-medium text-copy-primary"
            title={projectName}
          >
            {projectName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {onSave && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className={`text-xs px-3 ${saveStatus === "error" ? "text-state-error" : saveStatus === "saved" ? "text-state-success" : "text-copy-secondary"}`}
          >
            {saveBtnLabel}
          </Button>
        )}
        {onOpenTemplates && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenTemplates}
            aria-label="Starter templates"
          >
            <LayoutTemplate className="h-5 w-5" />
          </Button>
        )}
        {onShare && (
          <Button variant="ghost" size="icon" onClick={onShare} aria-label="Share project">
            <Share2 className="h-5 w-5" />
          </Button>
        )}
        {onToggleAiSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleAiSidebar}
            aria-label={isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"}
            className={isAiSidebarOpen ? "text-ai-text" : ""}
          >
            {isAiSidebarOpen ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelRightOpen className="h-5 w-5" />
            )}
          </Button>
        )}
        {showUserButton && <UserButton />}
      </div>
    </header>
  )
}
