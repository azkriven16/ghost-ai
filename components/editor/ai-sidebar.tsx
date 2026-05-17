"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Bot, Download, FileText, Send, X } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Message {
  role: "user" | "assistant"
  content: string
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    setMessages((prev) => [...prev, { role: "user", content: trimmed }])
    setInput("")
  }, [input])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleChip = useCallback((chip: string) => {
    setInput(chip)
    textareaRef.current?.focus()
  }, [])

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
        <Bot className="mt-0.5 h-4 w-4 shrink-0 text-ai-text" />
        <div className="ml-2 min-w-0 flex-1">
          <p className="text-sm font-semibold text-copy-primary">AI Workspace</p>
          <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
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
        <TabsContent
          value="architect"
          className="mt-0 flex min-h-0 flex-1 flex-col"
        >
          {/* Scrollable messages area */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-3 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Bot className="h-8 w-8 text-ai-text opacity-60" />
                  <p className="text-center text-xs leading-relaxed text-copy-muted">
                    Describe your system and Ghost AI will design the architecture for you.
                  </p>
                  <div className="flex w-full flex-col gap-2">
                    {STARTER_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => handleChip(chip)}
                        className="rounded-xl bg-subtle px-3 py-2 text-left text-xs text-ai-text transition-colors hover:bg-elevated"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) =>
                  msg.role === "user" ? (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl border-2 border-brand/50 bg-accent-dim px-3 py-2 text-xs text-copy-primary">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl border border-surface-border bg-elevated px-3 py-2 text-xs text-ai-text">
                        {msg.content}
                      </div>
                    </div>
                  )
                )
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-surface-border p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Ghost AI…"
                rows={1}
                className="min-h-[72px] max-h-[160px] flex-1 resize-none border-surface-border bg-elevated text-xs text-copy-primary placeholder:text-copy-faint focus-visible:ring-1 focus-visible:ring-ai"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim()}
                size="icon"
                aria-label="Send message"
                className="h-9 w-9 shrink-0 bg-ai text-white hover:bg-ai/80 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Specs tab */}
        <TabsContent
          value="specs"
          className="mt-0 flex min-h-0 flex-1 flex-col"
        >
          <div className="flex flex-col gap-4 p-4">
            <Button className="w-full bg-ai text-white hover:bg-ai/80">
              Generate Spec
            </Button>

            {/* Demo spec card */}
            <div className="rounded-2xl border border-surface-border bg-elevated p-3">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ai-text" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-copy-primary">
                    Microservices Architecture
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-copy-muted">
                    API Gateway → Auth → User Service → Order Service → Notification Service
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled
                  aria-label="Download spec"
                  className="h-7 w-7 shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
