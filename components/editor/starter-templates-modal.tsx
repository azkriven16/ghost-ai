"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"

interface StarterTemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (template: CanvasTemplate) => void
}

const PREVIEW_W = 240
const PREVIEW_H = 150
const PAD = 12

function TemplatePreview({ nodes, edges }: { nodes: CanvasNode[]; edges: CanvasEdge[] }) {
  if (!nodes.length) return null

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const node of nodes) {
    const nw = (node.style?.width as number) ?? 120
    const nh = (node.style?.height as number) ?? 60
    minX = Math.min(minX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxX = Math.max(maxX, node.position.x + nw)
    maxY = Math.max(maxY, node.position.y + nh)
  }

  const bw = maxX - minX + PAD * 2
  const bh = maxY - minY + PAD * 2
  const scale = Math.min(PREVIEW_W / bw, PREVIEW_H / bh)
  const ox = (PREVIEW_W - bw * scale) / 2
  const oy = (PREVIEW_H - bh * scale) / 2

  function toX(x: number) { return (x - minX + PAD) * scale + ox }
  function toY(y: number) { return (y - minY + PAD) * scale + oy }
  function toW(w: number) { return w * scale }
  function toH(h: number) { return h * scale }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  return (
    <svg width={PREVIEW_W} height={PREVIEW_H} className="block">
      {edges.map((edge) => {
        const src = nodeMap.get(edge.source)
        const tgt = nodeMap.get(edge.target)
        if (!src || !tgt) return null
        const sw = (src.style?.width as number) ?? 120
        const sh = (src.style?.height as number) ?? 60
        const tw = (tgt.style?.width as number) ?? 120
        const th = (tgt.style?.height as number) ?? 60
        return (
          <line
            key={edge.id}
            x1={toX(src.position.x + sw / 2)}
            y1={toY(src.position.y + sh / 2)}
            x2={toX(tgt.position.x + tw / 2)}
            y2={toY(tgt.position.y + th / 2)}
            stroke="#f8fafc40"
            strokeWidth={1}
          />
        )
      })}
      {nodes.map((node) => {
        const nw = (node.style?.width as number) ?? 120
        const nh = (node.style?.height as number) ?? 60
        const x = toX(node.position.x)
        const y = toY(node.position.y)
        const w = toW(nw)
        const h = toH(nh)
        const bg = node.data.bgColor ?? "#1F1F1F"
        const stroke = (node.data.textColor ?? "#EDEDED") + "60"
        const shape = node.data.shape ?? "rectangle"
        const cx = x + w / 2
        const cy = y + h / 2

        if (shape === "circle") {
          return (
            <ellipse
              key={node.id}
              cx={cx}
              cy={cy}
              rx={w / 2}
              ry={h / 2}
              fill={bg}
              stroke={stroke}
              strokeWidth={0.75}
            />
          )
        }

        if (shape === "diamond") {
          return (
            <polygon
              key={node.id}
              points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`}
              fill={bg}
              stroke={stroke}
              strokeWidth={0.75}
            />
          )
        }

        if (shape === "hexagon") {
          const rx = w / 2
          const ry = h / 2
          const pts = [
            [cx - rx,       cy      ],
            [cx - rx * 0.5, cy - ry ],
            [cx + rx * 0.5, cy - ry ],
            [cx + rx,       cy      ],
            [cx + rx * 0.5, cy + ry ],
            [cx - rx * 0.5, cy + ry ],
          ]
          return (
            <polygon
              key={node.id}
              points={pts.map((p) => p.join(",")).join(" ")}
              fill={bg}
              stroke={stroke}
              strokeWidth={0.75}
            />
          )
        }

        if (shape === "pill") {
          return (
            <rect
              key={node.id}
              x={x}
              y={y}
              width={w}
              height={h}
              rx={h / 2}
              fill={bg}
              stroke={stroke}
              strokeWidth={0.75}
            />
          )
        }

        if (shape === "cylinder") {
          const ery = Math.max(h * 0.12, 2)
          return (
            <g key={node.id}>
              <rect x={x} y={y + ery} width={w} height={h - ery} fill={bg} stroke={stroke} strokeWidth={0.75} />
              <ellipse cx={cx} cy={y + ery} rx={w / 2} ry={ery} fill={bg} stroke={stroke} strokeWidth={0.75} />
              <ellipse cx={cx} cy={y + h} rx={w / 2} ry={ery} fill={bg} stroke={stroke} strokeWidth={0.75} />
            </g>
          )
        }

        return (
          <rect
            key={node.id}
            x={x}
            y={y}
            width={w}
            height={h}
            rx={2}
            fill={bg}
            stroke={stroke}
            strokeWidth={0.75}
          />
        )
      })}
    </svg>
  )
}

export function StarterTemplatesModal({
  isOpen,
  onClose,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-surface-border px-6 pb-4 pt-6">
          <DialogTitle>Starter Templates</DialogTitle>
          <DialogDescription>
            Choose a template to begin. Your current canvas will be replaced.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[72vh]">
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            {CANVAS_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="flex flex-col overflow-hidden rounded-lg border border-surface-border bg-elevated"
              >
                <div className="flex items-center justify-center bg-base">
                  <TemplatePreview nodes={template.nodes} edges={template.edges} />
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <p className="text-sm font-medium text-copy-primary">{template.name}</p>
                  <p className="text-xs leading-relaxed text-copy-muted">{template.description}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1 w-full"
                    onClick={() => {
                      onImport(template)
                      onClose()
                    }}
                  >
                    Import
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
