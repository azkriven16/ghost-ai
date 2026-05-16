# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation — Editor Chrome (complete)

## Current Goal

- Feature 05: TBD

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

- Feature 03: Auth
  - `proxy.ts` at root — Next.js 16 renamed `middleware.ts` to `proxy.ts`; exports `proxy` (from `clerkMiddleware`) and `config.matcher`. All routes protected except `/sign-in(.*)` and `/sign-up(.*)`.
  - `app/layout.tsx` — `ClerkProvider` wraps the root layout with `@clerk/ui/themes` dark theme (`theme: dark`) and CSS variable overrides on `variables` (no hardcoded colors).
  - `app/page.tsx` — auth-aware redirect: authenticated → `/editor`, unauthenticated → `/sign-in`.
  - `app/editor/page.tsx` — editor route with `EditorShell` (canvas placeholder).
  - `app/(auth)/layout.tsx` — two-panel auth layout: left panel (logo, tagline, text-only feature list) hidden on small screens; right panel centered Clerk form. No gradients, no scroll-heavy layouts.
  - `app/(auth)/sign-in/[[...sign-in]]/page.tsx` — Clerk `<SignIn />` component.
  - `app/(auth)/sign-up/[[...sign-up]]/page.tsx` — Clerk `<SignUp />` component.
  - `components/editor/editor-navbar.tsx` — `UserButton` added to right section.
  - `@clerk/ui` installed; env vars added: `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`.
  - TypeScript clean, production build passes.

- Feature 04: Project Dialogs & Editor Home
  - `hooks/use-project-dialogs.ts` — hook managing all dialog state (open/close), form state (name, slug, newName), and loading state for Create / Rename / Delete dialogs. Includes `MOCK_PROJECTS` and `toSlug()` utility.
  - `components/editor/editor-context.tsx` — minimal React context exposing `openCreate` to children of `EditorShell`.
  - `components/editor/project-dialogs.tsx` — `CreateProjectDialog` (name input + live slug preview), `RenameProjectDialog` (prefilled input, auto-focus, Enter submits), `DeleteProjectDialog` (destructive confirm, no input).
  - `components/editor/editor-home.tsx` — home screen: heading, description, New Project button wired to `openCreate` via context.
  - `components/editor/editor-shell.tsx` — uses `useProjectDialogs`, provides `EditorContext`, passes project list + handlers to sidebar, renders all three dialogs.
  - `components/editor/project-sidebar.tsx` — project item list with hover-reveal rename/delete actions for owned projects; shared projects show no actions; mobile backdrop scrim closes sidebar on tap.
  - `app/editor/page.tsx` — renders `EditorHome` inside `EditorShell`.
  - TypeScript clean, production build passes.

## In Progress

- None.

## Next Up

- Feature 06: TBD

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- shadcn/ui CLI generates components into `components/ui/` — files are not modified post-install.
- Tailwind v4 `@theme inline` in `globals.css` maps both Ghost AI tokens (`--color-base`, `--color-copy-primary`, etc.) and shadcn's expected tokens (`--color-primary`, `--color-muted`, etc.) to Tailwind utilities.
- Dark-only: no `@media (prefers-color-scheme)` block — all values set once in `:root`.
- Next.js 16 renames `middleware.ts` → `proxy.ts` and the export from `middleware` → `proxy`. `clerkMiddleware` is exported as `proxy` const.
- Clerk appearance uses `theme:` (not `baseTheme:`) and `variables:` keys from `@clerk/ui/themes` / `@clerk/ui/internal` types.

## Session Notes

- Project is using Next.js 16 + Tailwind v4 + pnpm.
- `@/lib/utils` path alias resolves via `tsconfig.json` `@/*` → `./*`.
- Next.js 16 uses `proxy.ts` (not `middleware.ts`) at the project root.
- `@clerk/ui` is the bundled Clerk UI package (themes, components). Version 1.11.0 installed.
