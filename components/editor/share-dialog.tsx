"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CollaboratorProfile {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ShareDialogProps {
  isOpen: boolean;
  projectId: string;
  projectName: string;
  onClose: () => void;
}

function CollaboratorAvatar({ profile }: { profile: CollaboratorProfile }) {
  const label = profile.displayName ?? profile.email;
  const initial = label[0]?.toUpperCase() ?? "?";

  if (profile.avatarUrl) {
    return (
      <img
        src={profile.avatarUrl}
        alt={label}
        className="h-8 w-8 rounded-full object-cover shrink-0"
        onError={(e) => {
          e.currentTarget.onerror = null;
          const initial = label[0]?.toUpperCase() ?? "?";
          const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=random&size=32`;
          e.currentTarget.src = fallbackSrc;
        }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-dim text-xs font-medium text-brand"
    >
      {initial}
    </div>
  );
}

export function ShareDialog({
  isOpen,
  projectId,
  projectName,
  onClose,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorProfile[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const fetchCollaborators = useCallback(async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      if (!res.ok) {
        setFetchError("Failed to load collaborators.");
        return;
      }
      const data = await res.json();
      setCollaborators(data.collaborators ?? []);
      setIsOwner(data.isOwner ?? false);
    } catch {
      setFetchError("Failed to load collaborators.");
    } finally {
      setIsFetching(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      setInviteEmail("");
      setInviteError(null);
      setCopied(false);
      fetchCollaborators();
    }
  }, [isOpen, fetchCollaborators]);

  const handleInvite = useCallback(async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || isInviting) return;
    setInviteError(null);
    setIsInviting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setInviteError(
          (data as Record<string, string>).error ?? "Invite failed.",
        );
        return;
      }
      const data = await res.json();
      const added: CollaboratorProfile = data.collaborator;
      setCollaborators((prev) => {
        if (prev.some((c) => c.email === added.email)) return prev;
        return [...prev, added];
      });
      setInviteEmail("");
    } catch {
      setInviteError("Invite failed.");
    } finally {
      setIsInviting(false);
    }
  }, [inviteEmail, isInviting, projectId]);

  const handleRemove = useCallback(
    async (email: string) => {
      if (removingEmail) return;
      setRemovingEmail(email);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/collaborators?email=${encodeURIComponent(email)}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          console.error("Failed to remove collaborator");
          return;
        }
        setCollaborators((prev) => prev.filter((c) => c.email !== email));
      } catch {
        console.error("Error removing collaborator");
      } finally {
        setRemovingEmail(null);
      }
    },
    [removingEmail, projectId],
  );

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/editor/${projectId}`;
    if (!navigator.clipboard) {
      console.error("Clipboard API not available");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
      // Fallback: try execCommand
      try {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        console.error("Fallback copy method also failed");
      }
    }
  }, [projectId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl border-surface-border bg-elevated sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">
            Share &ldquo;{projectName}&rdquo;
          </DialogTitle>
          <DialogDescription className="text-copy-muted">
            {isOwner
              ? "Invite collaborators by email to give them access."
              : "People with access to this project."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Invite input — owner only */}
          {isOwner && (
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                disabled={isInviting}
                className="border-surface-border bg-subtle text-copy-primary placeholder:text-copy-faint"
              />
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || isInviting}
                className="shrink-0"
              >
                {isInviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Invite"
                )}
              </Button>
            </div>
          )}

          {inviteError && (
            <p className="text-sm text-destructive">{inviteError}</p>
          )}

          {/* Collaborator list */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wider text-copy-faint">
              People with access
            </p>

            {isFetching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-copy-faint" />
              </div>
            ) : fetchError ? (
              <p className="py-4 text-center text-sm text-destructive">
                {fetchError}
              </p>
            ) : collaborators.length === 0 ? (
              <p className="py-4 text-center text-sm text-copy-faint">
                No collaborators yet.
              </p>
            ) : (
              <ScrollArea className="max-h-48">
                <ul className="flex flex-col gap-1 py-1">
                  {collaborators.map((c) => (
                    <li
                      key={c.email}
                      className="flex items-center gap-3 rounded-xl px-2 py-1.5"
                    >
                      <CollaboratorAvatar profile={c} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        {c.displayName && (
                          <span className="truncate text-sm font-medium text-copy-primary">
                            {c.displayName}
                          </span>
                        )}
                        <span className="truncate text-xs text-copy-muted">
                          {c.email}
                        </span>
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${c.email}`}
                          onClick={() => handleRemove(c.email)}
                          disabled={removingEmail === c.email}
                          className="h-7 w-7 shrink-0 text-copy-faint hover:text-destructive"
                        >
                          {removingEmail === c.email ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>

          {/* Copy link */}
          <Button
            variant="ghost"
            onClick={handleCopyLink}
            className="w-full justify-start gap-2 text-copy-muted hover:text-copy-primary"
          >
            {copied ? (
              <Check className="h-4 w-4 text-brand" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy project link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
