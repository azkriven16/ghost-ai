# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation — UI Wired to API (complete)

## Current Goal

- Feature 10: TBD

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

- Feature 05: Prisma Schema & Data Layer
  - `@prisma/extension-accelerate` installed.
  - `prisma.config.ts` updated to use multi-file schema (`schema: "prisma"` directory); continues to load `DATABASE_URL` from `.env.local`.
  - `prisma/models/project.prisma` — `ProjectStatus` enum (`DRAFT`, `ARCHIVED`), `Project` model (ownerId, name, description?, status, canvasJsonPath?, timestamps, indexes on ownerId and createdAt), `ProjectCollaborator` model (projectId FK with cascade delete, email, createdAt, unique on projectId+email, indexes on email and projectId+createdAt).
  - `lib/prisma.ts` — cached singleton branching on `DATABASE_URL`: `prisma+postgres://` → `new PrismaClient({ accelerateUrl }).$extends(withAccelerate())`, otherwise → `PrismaPg` adapter with `pg.Pool`.
  - Migration `20260516084410_init` applied to Prisma Postgres at `db.prisma.io`.
  - Client regenerated to `app/generated/prisma/`; import via `@/app/generated/prisma/client`.
  - TypeScript clean, production build passes.

- Feature 06: Project APIs
  - `app/api/projects/route.ts` — `GET /api/projects` (list owner's projects, ordered by `createdAt desc`), `POST /api/projects` (create; defaults missing name to `Untitled Project`).
  - `app/api/projects/[projectId]/route.ts` — `PATCH /api/projects/[projectId]` (rename; 400 if name missing), `DELETE /api/projects/[projectId]` (returns 204).
  - Auth: `auth()` from `@clerk/nextjs/server`; unauthenticated → 401; non-owner mutations → 403.
  - `lib/prisma.ts` — return type annotated as `PrismaClient` with `as unknown as PrismaClient` cast on the Accelerate branch to resolve union type incompatibility.
  - TypeScript clean, production build passes.

- Feature 07: Wire Editor Home to Project APIs
  - `lib/projects.ts` — `getProjectsForUser()` server helper: fetches owned projects by `ownerId` and shared projects via `ProjectCollaborator.email` (resolved from `currentUser()`).
  - `hooks/use-project-actions.ts` — replaces `useProjectDialogs`; manages dialog state + real API mutations. Create calls `POST /api/projects`, navigates to `/editor/[id]`; rename calls `PATCH`, refreshes; delete calls `DELETE`, redirects to `/editor` if active workspace else refreshes. Create dialog generates a `shortSuffix` on open for room ID preview.
  - `components/editor/project-dialogs.tsx` — `CreateProjectDialog` prop `slug` → `roomId`; preview label updated to "Room ID".
  - `components/editor/project-sidebar.tsx` — imports `Project` from `use-project-actions`.
  - `components/editor/editor-shell.tsx` — accepts `ownedProjects` and `sharedProjects` as props; uses `useProjectActions`; passes combined list to sidebar.
  - `app/editor/page.tsx` — async server component; calls `getProjectsForUser()` and passes lists to `EditorShell`.
  - `hooks/use-project-dialogs.ts` — deleted (replaced by `use-project-actions`).
  - TypeScript clean, production build passes.

- Feature 08: Editor Workspace Shell
  - `lib/project-access.ts` — `getCurrentIdentity()` (userId + primary email via Clerk) and `canAccessProject()` (owner or collaborator check via Prisma).
  - `components/editor/access-denied.tsx` — centered lock icon, short message, link back to `/editor`. Used for missing or unauthorized projects.
  - `components/editor/editor-navbar.tsx` — extended with optional `projectName` (center), `onShare`, `isAiSidebarOpen`, `onToggleAiSidebar` props. PanelRightOpen/PanelRightClose icons for AI toggle; active state uses `text-ai-text`.
  - `components/editor/project-sidebar.tsx` — added `activeProjectId?: string` prop; active item highlighted with `bg-accent-dim` and `text-brand`.
  - `components/editor/workspace-shell.tsx` — client shell managing left sidebar + right AI sidebar state; renders `EditorNavbar` with project name, `ProjectSidebar` with active highlight, canvas placeholder, fixed right AI sidebar placeholder, and all three project dialogs.
  - `app/editor/[roomId]/page.tsx` — async server component; unauthenticated → redirect `/sign-in`; missing or unauthorized → `AccessDenied`; otherwise renders `WorkspaceShell` with project + user project lists.
  - TypeScript clean, production build passes.

- Feature 09: Share Dialog
  - `app/api/projects/[projectId]/collaborators/route.ts` — `GET` (list collaborators enriched with Clerk display name + avatar, returns `isOwner`), `POST` (invite by email, owner only, upserts to avoid duplicates), `DELETE` (remove by `?email=` query param, owner only).
  - `components/editor/share-dialog.tsx` — client dialog; fetches collaborators on open; owner view: email invite input, collaborator list with remove buttons; collaborator view: read-only list; copy project link with `Copied!` feedback; Clerk avatars with initial fallback.
  - `components/editor/workspace-shell.tsx` — imports `ShareDialog`, adds `isShareOpen` state, wires `onShare` to open it.
  - TypeScript clean, production build passes.

## In Progress

- None.

## Next Up

- Feature 10: TBD

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
- Prisma 7 generator provider is `"prisma-client"` (not `"prisma-client-js"`). Generated client lands in `app/generated/prisma/`. Import from `@/app/generated/prisma/client` (no index.ts barrel).
- `prisma.config.ts` uses `config({ path: ".env.local" })` from `dotenv`; `schema: "prisma"` (directory) enables multi-file schema — all `.prisma` files in `prisma/` are merged.
- `PrismaClientOptions` in Prisma 7 is a discriminated union: `{ adapter }` for direct pg or `{ accelerateUrl }` for Accelerate — cannot call `new PrismaClient()` with no arguments.
- Multi-file schema: `prisma/schema.prisma` holds generator + datasource; model files go in `prisma/models/*.prisma`.
