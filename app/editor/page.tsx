import { EditorShell } from "@/components/editor/editor-shell"

export default function EditorPage() {
  return (
    <EditorShell>
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-copy-muted">Canvas goes here</p>
      </div>
    </EditorShell>
  )
}
