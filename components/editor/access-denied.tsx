import Link from "next/link"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AccessDenied() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-base">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-elevated">
        <Lock className="h-8 w-8 text-copy-muted" />
      </div>
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold text-copy-primary">Access Denied</h2>
        <p className="text-sm text-copy-muted">
          This project doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/editor">Back to Editor</Link>
      </Button>
    </div>
  )
}
