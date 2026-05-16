"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CreateProjectDialogProps {
  isOpen: boolean
  name: string
  roomId: string
  isLoading: boolean
  onClose: () => void
  onNameChange: (name: string) => void
  onConfirm: () => void
}

export function CreateProjectDialog({
  isOpen,
  name,
  roomId,
  isLoading,
  onClose,
  onNameChange,
  onConfirm,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl border-surface-border bg-elevated">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">New project</DialogTitle>
          <DialogDescription className="text-copy-muted">
            Give your architecture workspace a name.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Input
            autoFocus
            placeholder="Project name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onConfirm()}
            className="border-surface-border bg-subtle text-copy-primary placeholder:text-copy-faint"
          />
          {roomId && (
            <p className="text-xs text-copy-muted">
              Room ID: <span className="font-mono text-copy-secondary">{roomId}</span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!name.trim() || isLoading}>
            Create project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface RenameProjectDialogProps {
  isOpen: boolean
  currentName: string
  newName: string
  isLoading: boolean
  onClose: () => void
  onNameChange: (name: string) => void
  onConfirm: () => void
}

export function RenameProjectDialog({
  isOpen,
  currentName,
  newName,
  isLoading,
  onClose,
  onNameChange,
  onConfirm,
}: RenameProjectDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl border-surface-border bg-elevated">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Rename project</DialogTitle>
          <DialogDescription className="text-copy-muted">
            Renaming &ldquo;{currentName}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <Input
          ref={inputRef}
          placeholder="Project name"
          value={newName}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && newName.trim() && onConfirm()}
          className="border-surface-border bg-subtle text-copy-primary placeholder:text-copy-faint"
        />

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!newName.trim() || isLoading}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteProjectDialogProps {
  isOpen: boolean
  projectName: string
  isLoading: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteProjectDialog({
  isOpen,
  projectName,
  isLoading,
  onClose,
  onConfirm,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl border-surface-border bg-elevated">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Delete project</DialogTitle>
          <DialogDescription className="text-copy-muted">
            &ldquo;{projectName}&rdquo; will be permanently deleted. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            Delete project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
