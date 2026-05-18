# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation — UI Wired to API (complete)

## Current Goal

- Feature 22: TBD

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

- Feature 10: Liveblocks Setup
  - `liveblocks.config.ts` — `Presence` typed with `cursor: { x, y } | null` and `thinking: boolean` (renamed from `isThinking` in Feature 19); `UserMeta.info` typed with `name`, `avatar`, `cursorColor`.
  - `lib/liveblocks.ts` — cached `Liveblocks` node client singleton (throws at startup if `LIVEBLOCKS_SECRET_KEY` missing); `getCursorColor(userId)` deterministically maps user ID hash to one of 10 palette colors.
  - `app/api/liveblocks-auth/route.ts` — `POST`: requires Clerk auth, validates `projectId` body param, verifies project access via `canAccessProject`, ensures room exists via `getOrCreateRoom`, issues session token with user name/avatar/cursor color.
  - `@liveblocks/node@3.19.1` installed.
  - TypeScript clean, production build passes.

- Feature 11: Base Canvas
  - `types/canvas.ts` — `CanvasNodeData` interface (`label`, `color?`, `shape?`); `CanvasNode` and `CanvasEdge` typed aliases using `"canvasNode"` and `"canvasEdge"` discriminants.
  - `components/editor/canvas.tsx` — client component; `useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true })` wires Liveblocks Storage to `ReactFlow`; `Background` with dot pattern, `MiniMap`; `@xyflow/react/dist/style.css` imported.
  - `components/editor/canvas-provider.tsx` — client wrapper; `LiveblocksProvider` with custom `authEndpoint` function that POSTs `{ projectId: room }` to `/api/liveblocks-auth`; `RoomProvider` with `initialPresence: { cursor: null, isThinking: false }`; `ClientSideSuspense` with loading fallback and error fallback.
  - `components/editor/workspace-shell.tsx` — canvas placeholder replaced with `<CanvasProvider roomId={projectId} />`.
  - `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` and `LIVEBLOCKS_SECRET_KEY` added to `.env.local`.
  - TypeScript clean, production build passes.

- Feature 12: Shape Panel
  - `types/canvas.ts` — `CanvasShape` exported as a union type (`"rectangle" | "circle" | "diamond" | "pill" | "cylinder" | "hexagon"`); `CanvasNodeData.shape` uses it.
  - `components/editor/canvas-node.tsx` — `CanvasNodeRenderer` registered as `"canvasNode"` type; renders bordered rectangle with centered label, connection handles on all four sides, selection ring via `boxShadow`.
  - `components/editor/shape-panel.tsx` — floating pill toolbar via React Flow `Panel position="bottom-center"`; six draggable `ShapeButton` items (Rectangle 200×80, Diamond 140×140, Circle 100×100, Pill 180×60, Cylinder 100×120, Hexagon 120×120); drag payload `{ shape, width, height }` written as `application/ghost-shape` on `dataTransfer`.
  - `components/editor/canvas.tsx` — `onInit` stores React Flow instance ref; `onDragOver` enables copy drop effect; `onDrop` parses payload, calls `rfInstance.screenToFlowPosition`, centers node on cursor, generates ID `${shape}-${Date.now()}-${counter}`, calls `onNodesChange([{ type: "add", item }])`; `nodeTypes` registers `CanvasNodeRenderer`; `ShapePanel` rendered inside `ReactFlow`.
  - TypeScript clean, production build passes.

- Feature 13: Node Shape Rendering & Drag Preview
  - `components/editor/canvas-node.tsx` — replaced placeholder with shape-aware rendering: CSS shapes (`rectangle` with `border-radius:6px`, `pill`/`circle` with `border-radius:9999px`); SVG shapes (`diamond`, `hexagon` flat-top, `cylinder`) using `viewBox="0 0 100 100" preserveAspectRatio="none"`. Borders at `${color}99` at rest, full color when selected; selection ring via `boxShadow` on CSS shapes.
  - `components/editor/shape-panel.tsx` — added `createDragPreview()` and `getSvgPreviewMarkup()` helpers; `onDragStart` calls `event.dataTransfer.setDragImage` with a scaled (75%) shape preview element appended to `document.body`, removed via `requestAnimationFrame` after capture. `getComputedStyle` resolves `--color-surface` at runtime for the preview background.
  - TypeScript clean, production build passes.

- Feature 14: Node Resizing & Inline Label Editing
  - `components/editor/canvas-node.tsx` — added `NodeResizer` (from `@xyflow/react`) with `isVisible={!!selected}`, per-shape `minWidth`/`minHeight` from `SHAPE_MIN` table, colored handles (8×8px, `border-radius:2px`) and subtle line styling at `${color}55` opacity.
  - `useReactFlow().updateNodeData` + `useNodeId()` sync label changes through the existing `onNodesChange` → Liveblocks pipeline.
  - Editing state (`isEditing`, `draft`) lives in `CanvasNodeRenderer`; a `<textarea>` overlay (`position:absolute; top:50%; transform:translateY(-50%)`) is passed as `editOverlay` to both `CssShapeNode` and `SvgShapeNode`.
  - Double-click enters edit mode; blur or Enter commits; Escape discards. `onMouseDown`/`onPointerDown` stop propagation on the textarea to prevent canvas drag/pan.
  - TypeScript clean, production build passes.

- Feature 15: Node Color Toolbar
  - `types/canvas.ts` — added `NodeColorPair` interface and `NODE_COLORS` constant (8 bg/text pairs from ui-context); added `bgColor?` and `textColor?` to `CanvasNodeData`.
  - `components/editor/node-color-toolbar.tsx` — `NodeToolbar` (Position.Top, offset 8) with 8 color swatches; active swatch has colored `outline`; hover shows tight `box-shadow` glow at `${pair.text}40`; `onMouseDown`/`onPointerDown` stop propagation.
  - `components/editor/canvas-node.tsx` — `bgColor`/`textColor` wired into CSS shape background and SVG fill; `NodeLabel` accepts `textColor`; SVG path sub-components refactored to accept `fill`, `stroke`, `sw` directly; `handleColorSelect` calls `updateNodeData` through Liveblocks pipeline.
  - TypeScript clean, production build passes.

- Feature 16: Edge Behavior
  - `types/canvas.ts` — added `CanvasEdgeData` interface (`label?: string`); `CanvasEdge` typed as `Edge<CanvasEdgeData, "canvasEdge">`.
  - `components/editor/canvas-edge.tsx` — `getSmoothStepPath` (`borderRadius:8`); visible 1.5px path + transparent 20px interaction overlay; `markerEnd` passed through; `isHovered` drives stroke transition `#f8fafc60` → `#f8fafc`; `EdgeLabelRenderer` at midpoint; auto-sizing input, pill badge, faint hint when active+empty; `updateEdgeData` → Liveblocks.
  - `components/editor/canvas.tsx` — `edgeTypes`, `defaultEdgeOptions` (MarkerType.ArrowClosed); `handleConnect` wraps `onEdgesChange` with typed `CanvasEdge` (bypasses Liveblocks' untyped `onConnect`).
  - `components/editor/canvas-node.tsx` — all 4 `Handle` components get `className="canvas-handle"`.
  - `app/globals.css` — `.canvas-handle`: 10×10px white dot, hidden by default, shown on node hover/selection and during connecting/valid states.
  - TypeScript clean, production build passes.

- Feature 17: Canvas Ergonomics
  - `components/editor/canvas-controls.tsx` — floating pill control bar (`Panel position="bottom-left"`); zoom out/fit/in buttons; undo/redo buttons with `useUndo`/`useRedo`/`useCanUndo`/`useCanRedo` from `@liveblocks/react`; `disabled:opacity-30` on history buttons.
  - `hooks/use-keyboard-shortcuts.ts` — `window.addEventListener("keydown")`; skips `INPUT`/`TEXTAREA`/`contentEditable` targets; `+`/`=` → zoom in, `-` → zoom out, `Ctrl+Z` → undo, `Ctrl+Shift+Z`/`Ctrl+Y` → redo.
  - `components/editor/canvas.tsx` — `<CanvasControls />` rendered inside `<ReactFlow>` so both `useReactFlow` and Liveblocks hooks are in scope.
  - Build not run (pnpm build denied by user); TypeScript assumed clean based on implementation.

- Feature 18: Starter Templates
  - `components/editor/starter-templates.ts` — `CanvasTemplate` interface; `CANVAS_TEMPLATES` array (3 templates: Microservices Architecture, CI/CD Pipeline, Event-Driven System) using `NODE_COLORS` and shared canvas types; `n()`/`e()` helpers for terse template data.
  - `components/editor/starter-templates-modal.tsx` — shadcn `Dialog` with `ScrollArea`; 2-col card grid; `TemplatePreview` SVG component computes bounds from node positions, scales to 240×150 viewport, draws edges as `<line>` elements and nodes as shape-appropriate SVG primitives (rect/ellipse/polygon); Import button calls `onImport(template)` then closes.
  - `components/editor/canvas.tsx` — converted to `forwardRef<CanvasHandle>` exporting `CanvasHandle` interface; `useImperativeHandle` exposes `importTemplate(nodes, edges)`: atomically removes all existing nodes/edges then adds template items via `onNodesChange`/`onEdgesChange`, then `fitView(400ms)` after 50ms.
  - `components/editor/canvas-provider.tsx` — accepts optional `canvasRef?: RefObject<CanvasHandle>`, passes to `<Canvas ref={canvasRef ?? null} />`.
  - `components/editor/editor-navbar.tsx` — `onOpenTemplates?` prop; `LayoutTemplate` icon button added before Share button.
  - `components/editor/workspace-shell.tsx` — `canvasRef = useRef<CanvasHandle>(null)`; `isTemplatesOpen` state; `handleTemplateImport` delegates to `canvasRef.current?.importTemplate`; `StarterTemplatesModal` rendered at root.
  - Build not run (pnpm build denied by user); TypeScript assumed clean based on implementation.

- Feature 19: Presence Avatars & Live Cursors
  - `liveblocks.config.ts` — renamed `isThinking` → `thinking` in `Presence` type per spec.
  - `components/editor/canvas-provider.tsx` — updated `initialPresence` to `{ cursor: null, thinking: false }`.
  - `components/editor/live-cursors.tsx` — renders other participants' cursors as an `absolute inset-0 pointer-events-none` overlay inside `<ReactFlow>`; uses `useOthers` + `useReactFlow().flowToScreenPosition` to convert flow coords to wrapper-relative screen coords; colored SVG pointer + pill name badge per participant color; never shows current user.
  - `components/editor/presence-avatars.tsx` — React Flow `Panel position="top-right"`; `useOthers` for collaborator list; overlapping avatar stack (max 5 + `+N` overflow chip), each with `ring-2 ring-base` readability ring; divider shown only when collaborators exist; `UserButton` from Clerk always rendered last.
  - `components/editor/canvas.tsx` — imports `useUpdateMyPresence`; `handleMouseMove` broadcasts cursor in flow coordinates via `rfInstance.screenToFlowPosition`; `handleMouseLeave` sets cursor to null; both wired to wrapper div; `LiveCursors` and `PresenceAvatars` rendered inside `<ReactFlow>` children.
  - TypeScript clean (build not run).

- Feature 20: AI Sidebar Shell
  - `components/editor/ai-sidebar.tsx` — extracted from `workspace-shell.tsx` placeholder; preserves existing `fixed right-0 top-12 z-40` floating position, slide-in transition, `border-l border-surface-border bg-base/95 backdrop-blur-sm` surface treatment, and `aria-hidden`/`inert` accessibility attributes.
  - Header: Bot icon, "AI Workspace" title (`text-copy-primary`), "Collaborate with Ghost AI" subtitle (`text-copy-muted`), close button (`X` icon, `ghost` variant).
  - shadcn `Tabs` with "AI Architect" and "Specs" tabs; `TabsTrigger` styled `data-[state=active]:bg-subtle data-[state=active]:text-ai-text`; inactive tabs use `text-copy-muted`.
  - AI Architect tab: scrollable messages area (flex `min-h-0 overflow-y-auto`); empty state with Bot icon, description, and three starter prompt chips (`bg-subtle text-ai-text`); user messages right-aligned (`bg-accent-dim border-2 border-brand/50 text-copy-primary`); assistant messages left-aligned (`bg-elevated border border-surface-border text-ai-text`); auto-resizing textarea (min 72px / max 160px) with `Enter` sends / `Shift+Enter` newline; Send button (`bg-ai text-white`).
  - Specs tab: "Generate Spec" button (`bg-ai text-white`); demo spec card (`bg-elevated rounded-2xl border-surface-border`) with FileText icon, title, snippet, and disabled Download button.
  - `components/editor/workspace-shell.tsx` — inline aside replaced with `<AiSidebar isOpen={isAiSidebarOpen} onClose={...} />`.
  - TypeScript clean (build not run).

- Feature 21: Canvas Autosave
  - `@vercel/blob@2.3.3` installed.
  - `prisma/models/project.prisma` — reuses existing `canvasJsonPath String?` field to store Vercel Blob URL; no migration needed.
  - `app/api/projects/[projectId]/canvas/route.ts` — `PUT`: requires Clerk auth + `canAccessProject`; validates `{ nodes, edges }` body; uploads canvas JSON to Vercel Blob at `canvas/{projectId}.json` (`addRandomSuffix: false` for stable path); updates `project.canvasJsonPath`; returns blob URL. `GET`: requires Clerk auth + `canAccessProject`; reads `canvasJsonPath` from Prisma; fetches and proxies the blob JSON; 204 if no saved canvas.
  - `hooks/use-canvas-autosave.ts` — `useCanvasAutosave(nodes, edges, projectId)` → `SaveStatus`; skips initial mount via `mountedRef`; debounces 2 s via `timerRef`; returns `"idle" | "saving" | "saved" | "error"`.
  - `components/editor/canvas.tsx` — accepts `projectId` and `onSaveStatusChange` props; runs `useCanvasAutosave` and forwards status changes; load-on-mount `useEffect`: only runs once, skips if room already has nodes/edges, fetches saved canvas from API and loads via `onNodesChange`/`onEdgesChange` + `fitView`.
  - `components/editor/canvas-provider.tsx` — accepts `onSaveStatusChange?` prop; passes `projectId={roomId}` and `onSaveStatusChange` to `Canvas`.
  - `components/editor/workspace-shell.tsx` — holds `saveStatus` state; `handleSaveStatusChange` (stable `useCallback`) passed to `CanvasProvider`; `saveStatus` forwarded to `EditorNavbar`.
  - `components/editor/editor-navbar.tsx` — `saveStatus?: SaveStatus` prop; `SAVE_LABEL` map (idle→null, saving→"Saving…", saved→"Saved", error→"Save failed"); status text rendered next to project name in center section (`text-copy-faint`, or `text-state-error` on error).
  - Requires `BLOB_READ_WRITE_TOKEN` in environment.
  - TypeScript clean (build not run).

## In Progress

- None.

## Next Up

- TBD

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
