# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation — Editor Chrome (complete)

## Current Goal

- Define the immediate implementation goal here.

## Completed

- Feature 01: Design System
  - `globals.css` replaced with dark-only theme: all Ghost AI design tokens as CSS custom properties, mapped to Tailwind utilities via `@theme inline`. No light mode.
  - shadcn/ui installed and configured (`components.json`).
  - shadcn components added: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea (`components/ui/`).
  - `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority` installed.
  - `lib/utils.ts` created with `cn()` helper.
  - TypeScript and production build pass clean.

- Feature 02: Editor Chrome
  - `components/editor/editor-navbar.tsx` — `h-12` fixed-height navbar, left sidebar toggle (PanelLeftOpen/PanelLeftClose), dark bg with `border-b border-surface-border`, left/center/right sections.
  - `components/editor/project-sidebar.tsx` — fixed overlay (`fixed left-0 top-12 z-40`), slides in from left via `translate-x`, `isOpen`/`onClose` props, Projects header + close button, Tabs (My Projects / Shared) with empty placeholders, full-width New Project button pinned to bottom.
  - Dialog pattern: shadcn Dialog ships with DialogTitle/DialogDescription/DialogFooter — ready for future dialogs without additional files.
  - TypeScript clean, production build passes.

## In Progress

- None yet.

## Next Up

- Feature 03: Auth (Clerk sign-in, route protection)

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- shadcn/ui CLI generates components into `components/ui/` — files are not modified post-install.
- Tailwind v4 `@theme inline` in `globals.css` maps both Ghost AI tokens (`--color-base`, `--color-copy-primary`, etc.) and shadcn's expected tokens (`--color-primary`, `--color-muted`, etc.) to Tailwind utilities.
- Dark-only: no `@media (prefers-color-scheme)` block — all values set once in `:root`.

## Session Notes

- Project is using Next.js 16 + Tailwind v4 + pnpm.
- `@/lib/utils` path alias resolves via `tsconfig.json` `@/*` → `./*`.
