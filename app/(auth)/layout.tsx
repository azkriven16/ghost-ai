export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen bg-base">
      {/* Left panel — hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-surface-border px-16 py-14">
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect width="28" height="28" rx="7" fill="var(--accent-primary)" fillOpacity="0.15" />
            <path
              d="M8 14h4m0 0v-4m0 4v4m0-4h8"
              stroke="var(--accent-primary)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-semibold tracking-tight text-copy-primary">Ghost AI</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-3xl font-semibold tracking-tight text-copy-primary leading-snug">
              Design systems.<br />Ship faster.
            </p>
            <p className="text-sm text-copy-muted max-w-xs leading-relaxed">
              An AI-powered canvas for teams who think in architecture and build in code.
            </p>
          </div>

          <ul className="space-y-2.5 text-sm text-copy-secondary">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand">—</span>
              Collaborative AI canvas for system architecture
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand">—</span>
              Generate technical specs from your diagrams
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand">—</span>
              Real-time multiplayer with presence and cursors
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand">—</span>
              Durable AI generation with background tasks
            </li>
          </ul>
        </div>

        <p className="text-xs text-copy-faint" suppressHydrationWarning>&copy; {new Date().getFullYear()} Ghost AI</p>
      </div>

      {/* Right panel — Clerk form */}
      <div className="flex flex-1 lg:w-1/2 items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  )
}
