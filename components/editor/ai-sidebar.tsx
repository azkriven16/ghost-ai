"use client"

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { Bot, Download, FileText, Loader2, MessageSquare, Send, X } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEventListener, useStorage, useMutation, useUpdateMyPresence, useSelf } from "@liveblocks/react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import ReactMarkdown from "react-markdown"
import { AiStatusMessageSchema, ChatMessageSchema, type ChatMessage } from "@/types/tasks"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"
import type { designAgent } from "@/trigger/design-agent"
import type { generateSpec } from "@/trigger/generate-spec"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  roomId: string
  getCanvasData: () => { nodes: CanvasNode[]; edges: CanvasEdge[] }
}

const TERMINAL_STATUSES = [
  "COMPLETED",
  "FAILED",
  "CANCELED",
  "SYSTEM_FAILURE",
  "INTERRUPTED",
  "CRASHED",
  "TIMED_OUT",
] as const

type SpecItem = { id: string; createdAt: string; filePath: string }

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatSpecDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AiSidebar({ isOpen, onClose, projectId, roomId, getCanvasData }: AiSidebarProps) {
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [runId, setRunId] = useState<string | null>(null)
  const [publicToken, setPublicToken] = useState<string | null>(null)
  const handledRunRef = useRef<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [specs, setSpecs] = useState<SpecItem[]>([])
  const [specsLoading, setSpecsLoading] = useState(false)
  const [previewSpecId, setPreviewSpecId] = useState<string | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [specRunId, setSpecRunId] = useState<string | null>(null)
  const [specPublicToken, setSpecPublicToken] = useState<string | null>(null)
  const [specGenError, setSpecGenError] = useState<string | null>(null)
  const handledSpecRunRef = useRef<string | null>(null)

  const self = useSelf()
  const updateMyPresence = useUpdateMyPresence()
  const feedData = useStorage((root) => root.aiStatusFeed)
  const rawChat = useStorage((root) => root.aiChat)

  const updateFeed = useMutation(
    ({ storage }, data: { text?: string; status?: "thinking" | "generating" | "complete" | "error"; timestamp?: number } | null) => {
      storage.set("aiStatusFeed", data)
    },
    []
  )

  const addMessage = useMutation(
    ({ storage }, msg: ChatMessage) => {
      storage.get("aiChat")?.push(msg)
    },
    []
  )

  const { run } = useRealtimeRun<typeof designAgent>(runId ?? "", {
    accessToken: publicToken ?? "",
    enabled: !!runId && !!publicToken,
  })

  // Handle run completion — push final AI message and reset state
  useEffect(() => {
    if (!run || !runId) return
    if (!TERMINAL_STATUSES.includes(run.status as typeof TERMINAL_STATUSES[number])) return
    if (handledRunRef.current === runId) return

    handledRunRef.current = runId

    const content =
      run.status === "COMPLETED"
        ? "Design applied to canvas."
        : "Generation failed. Please try again."

    addMessage({
      id: crypto.randomUUID(),
      sender: "Ghost AI",
      role: "assistant",
      content,
      timestamp: Date.now(),
    })

    updateMyPresence({ thinking: false })
    updateFeed(null)
    setRunId(null)
    setPublicToken(null)
  }, [run?.status, runId, addMessage, updateMyPresence, updateFeed])

  const fetchSpecs = useCallback(async () => {
    setSpecsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/specs`)
      if (!res.ok) throw new Error("Failed to load specs")
      const data = (await res.json()) as SpecItem[]
      setSpecs(data)
    } catch {
      // silent — list stays empty
    } finally {
      setSpecsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (isOpen) fetchSpecs()
  }, [isOpen, fetchSpecs])

  const { run: specRun } = useRealtimeRun<typeof generateSpec>(specRunId ?? "", {
    accessToken: specPublicToken ?? "",
    enabled: !!specRunId && !!specPublicToken,
  })

  // Handle spec run completion — refresh list and reset state
  useEffect(() => {
    if (!specRun || !specRunId) return
    if (!TERMINAL_STATUSES.includes(specRun.status as typeof TERMINAL_STATUSES[number])) return
    if (handledSpecRunRef.current === specRunId) return

    handledSpecRunRef.current = specRunId

    if (specRun.status === "COMPLETED") {
      fetchSpecs()
    } else {
      setSpecGenError("Spec generation failed. Please try again.")
    }

    setSpecRunId(null)
    setSpecPublicToken(null)
  }, [specRun?.status, specRunId, fetchSpecs])

  // Validate messages before rendering
  const messages = useMemo<ChatMessage[]>(() => {
    if (!rawChat) return []
    return [...rawChat].reduce<ChatMessage[]>((acc, raw) => {
      const result = ChatMessageSchema.safeParse(raw)
      if (result.success) acc.push(result.data)
      return acc
    }, [])
  }, [rawChat])

  // Handle AI_STATUS events — write to shared feed, track thinking presence
  useEventListener(({ event }) => {
    if (event.type !== "AI_STATUS") return
    const validated = AiStatusMessageSchema.safeParse({
      text: event.message,
      status: event.status,
      timestamp: Date.now(),
    })
    if (!validated.success) return
    updateFeed(validated.data)
    if (event.status === "complete" || event.status === "error") {
      updateMyPresence({ thinking: false })
    }
  })

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleGenerateSpec = useCallback(async () => {
    if (specRunId) return
    setSpecGenError(null)

    const { nodes, edges } = getCanvasData()

    try {
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, chatHistory: messages, nodes, edges }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>
        throw new Error(typeof err.error === "string" ? err.error : "Failed to start spec generation")
      }

      const { runId: newRunId, publicToken: token } = await res.json() as { runId: string; publicToken: string }
      setSpecRunId(newRunId)
      setSpecPublicToken(token)
    } catch (err) {
      setSpecGenError(err instanceof Error ? err.message : "Something went wrong")
    }
  }, [specRunId, getCanvasData, roomId, messages])

  const openPreview = useCallback(
    async (specId: string) => {
      setPreviewSpecId(specId)
      setPreviewContent(null)
      setPreviewLoading(true)
      try {
        const res = await fetch(`/api/projects/${projectId}/specs/${specId}/download`)
        if (!res.ok) throw new Error("Failed to load spec")
        setPreviewContent(await res.text())
      } catch {
        setPreviewContent("Failed to load spec content.")
      } finally {
        setPreviewLoading(false)
      }
    },
    [projectId]
  )

  const closePreview = useCallback(() => {
    setPreviewSpecId(null)
    setPreviewContent(null)
  }, [])

  const handleDownload = useCallback(
    (specId: string) => {
      const a = document.createElement("a")
      a.href = `/api/projects/${projectId}/specs/${specId}/download`
      a.download = `spec-${specId.slice(0, 8)}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },
    [projectId]
  )

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isSending || !!runId) return

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: self?.info?.name ?? "Anonymous",
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    }

    setInput("")
    setSendError(null)
    setIsSending(true)

    try {
      addMessage(msg)

      const designRes = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, roomId, projectId }),
      })

      if (!designRes.ok) {
        const err = await designRes.json().catch(() => ({})) as Record<string, unknown>
        throw new Error(typeof err.error === "string" ? err.error : "Failed to start design agent")
      }

      const { runId: newRunId, publicToken: token } = await designRes.json() as { runId: string; publicToken: string }

      setRunId(newRunId)
      setPublicToken(token)
      updateMyPresence({ thinking: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setSendError(message)
      addMessage({
        id: crypto.randomUUID(),
        sender: "Ghost AI",
        role: "assistant",
        content: `Error: ${message}`,
        timestamp: Date.now(),
      })
    } finally {
      setIsSending(false)
    }
  }, [input, isSending, runId, self, addMessage, roomId, projectId, updateMyPresence])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const isRunActive = !!runId
  const isDisabled = isSending || isRunActive

  return (
    <aside
      aria-hidden={isOpen ? "false" : "true"}
      inert={!isOpen || undefined}
      className={`fixed right-0 top-12 z-40 flex h-[calc(100dvh-3rem)] w-80 flex-col border-l border-surface-border bg-base/95 backdrop-blur-sm transition-transform duration-200 ease-in-out ${
        isOpen
          ? "translate-x-0 pointer-events-auto"
          : "translate-x-full pointer-events-none"
      }`}
    >
      {/* Header */}
      <div className="flex shrink-0 items-start border-b border-surface-border px-4 py-3">
        <div className="relative mt-0.5 shrink-0">
          <Bot className="h-4 w-4 text-ai-text" />
          {isRunActive && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#62C073]" />
          )}
        </div>
        <div className="ml-2 min-w-0 flex-1">
          <p className="text-sm font-semibold text-copy-primary">AI Workspace</p>
          <p className="text-xs text-copy-muted">
            {isRunActive ? "Generating…" : "Collaborate with Ghost AI"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close AI sidebar"
          className="ml-1 h-7 w-7 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="architect" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-4 mb-0 mt-3 h-8 w-auto shrink-0 self-start gap-0.5 rounded-xl bg-elevated p-0.5">
          <TabsTrigger
            value="architect"
            className="h-7 rounded-lg px-3 text-xs text-copy-muted data-[state=active]:bg-subtle data-[state=active]:text-ai-text data-[state=active]:shadow-none"
          >
            AI Architect
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            className="h-7 rounded-lg px-3 text-xs text-copy-muted data-[state=active]:bg-subtle data-[state=active]:text-ai-text data-[state=active]:shadow-none"
          >
            Specs
          </TabsTrigger>
        </TabsList>

        {/* AI Architect tab */}
        <TabsContent value="architect" className="mt-0 flex min-h-0 flex-1 flex-col">
          {/* Scrollable chat messages */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-3 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10">
                  <MessageSquare className="h-7 w-7 text-ai-text opacity-40" />
                  <p className="text-center text-xs leading-relaxed text-copy-muted">
                    Say something. Everyone in this room will see it.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col gap-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] font-semibold text-copy-primary">
                        {msg.sender}
                      </span>
                      <span className="text-[10px] text-copy-faint">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p
                      className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        msg.role === "assistant"
                          ? "border border-surface-border bg-elevated text-ai-text"
                          : "bg-[#62C073] text-[#0F2E18] font-medium"
                      }`}
                    >
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-surface-border p-3">
            {/* Status strip — only shown while a run is active */}
            {isRunActive && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#62C073]/20 bg-[#0F2E18] px-3 py-1.5 text-xs text-[#62C073]">
                <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                <span className="truncate">
                  {feedData?.text ?? "Working on your design…"}
                </span>
              </div>
            )}
            {sendError && (
              <p className="mb-2 text-[11px] text-state-error">{sendError}</p>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your architecture…"
                rows={1}
                disabled={isDisabled}
                className="min-h-18 max-h-40 flex-1 resize-none border-surface-border bg-elevated text-xs text-copy-primary placeholder:text-copy-faint focus-visible:ring-1 focus-visible:ring-[#62C073] disabled:opacity-50"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isDisabled}
                size="icon"
                aria-label="Send message"
                className="h-9 w-9 shrink-0 bg-[#62C073] text-[#0F2E18] hover:bg-[#62C073]/80 disabled:opacity-40"
              >
                {isDisabled ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Specs tab */}
        <TabsContent value="specs" className="mt-0 flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            <Button
              className="w-full shrink-0 bg-[#62C073] text-[#0F2E18] hover:bg-[#62C073]/80 disabled:opacity-50"
              onClick={handleGenerateSpec}
              disabled={!!specRunId}
            >
              {specRunId ? (
                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Generating…</>
              ) : (
                "Generate Spec"
              )}
            </Button>
            {specGenError && (
              <p className="text-[11px] text-state-error">{specGenError}</p>
            )}

            {specsLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-ai-text" />
              </div>
            ) : specs.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8">
                <FileText className="h-6 w-6 text-ai-text opacity-30" />
                <p className="text-center text-xs text-copy-faint">No specs yet.</p>
              </div>
            ) : (
              <ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col gap-2 pb-2">
                  {specs.map((spec) => (
                    <div
                      key={spec.id}
                      className="group flex items-center gap-2 rounded-xl border border-surface-border bg-elevated p-3 hover:bg-subtle transition-colors"
                    >
                      <button
                        onClick={() => openPreview(spec.id)}
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                        aria-label={`Preview spec-${spec.id.slice(0, 8)}.md`}
                      >
                        <FileText className="h-4 w-4 shrink-0 text-ai-text" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-copy-primary">
                            spec-{spec.id.slice(0, 8)}.md
                          </p>
                          <p className="mt-0.5 text-[10px] text-copy-faint">
                            {formatSpecDate(spec.createdAt)}
                          </p>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(spec.id)}
                        aria-label="Download spec"
                        className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Spec preview modal */}
      <Dialog open={!!previewSpecId} onOpenChange={(open) => { if (!open) closePreview() }}>
        <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col border-surface-border bg-base">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-sm text-copy-primary">
              spec-{previewSpecId?.slice(0, 8)}.md
            </DialogTitle>
            <DialogDescription className="sr-only">
              Generated technical specification
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1">
            {previewLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-ai-text" />
              </div>
            ) : (
              <div className="prose-sm p-1 text-xs text-copy-primary [&_a]:text-ai-text [&_blockquote]:border-l-2 [&_blockquote]:border-surface-border [&_blockquote]:pl-3 [&_blockquote]:text-copy-muted [&_code]:rounded [&_code]:bg-elevated [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[10px] [&_code]:text-ai-text [&_h1]:mb-2 [&_h1]:text-sm [&_h1]:font-bold [&_h1]:text-copy-primary [&_h2]:mb-1.5 [&_h2]:mt-4 [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:text-copy-primary [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-xs [&_h3]:font-medium [&_h3]:text-copy-primary [&_li]:mb-0.5 [&_li]:text-copy-muted [&_ol]:mb-2 [&_ol]:pl-4 [&_p]:mb-2 [&_p]:leading-relaxed [&_p]:text-copy-muted [&_pre]:mb-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-elevated [&_pre]:p-2 [&_strong]:font-semibold [&_strong]:text-copy-primary [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-4">
                <ReactMarkdown>
                  {previewContent ?? ""}
                </ReactMarkdown>
              </div>
            )}
          </ScrollArea>

          <div className="flex shrink-0 justify-end gap-2 border-t border-surface-border pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={closePreview}
              className="text-xs text-copy-muted"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => previewSpecId && handleDownload(previewSpecId)}
              className="bg-[#62C073] text-[#0F2E18] text-xs hover:bg-[#62C073]/80"
            >
              <Download className="mr-1.5 h-3 w-3" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
