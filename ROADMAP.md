# DeepPivot Roadmap

## What We Have Today

### Core Platform (Shipped)

| Layer | Tech | Status |
|---|---|---|
| Framework | Next.js 14.2 (App Router) | Live |
| Database | PostgreSQL on Neon | Live |
| ORM | Drizzle ORM 0.44 | Live |
| Auth | Clerk (webhook + client sync) | Live |
| AI Voice | Hume EVI integration | Live |
| UI | Radix UI + Tailwind CSS 4 | Live |
| Hosting | Vercel (inferred from Next.js) | Live |

### Database Models

- **users** — Full user profile with Clerk sync, credits system, role/status flags
- **job_boards** — Per-user kanban boards (NEW, JT1)
- **job_columns** — Ordered columns within boards (NEW, JT1)
- **job_applications** — Job cards with tags, status, order, workflow traceability (NEW, JT1)

### Existing Routes

```
/                         Landing page (Hume AI chat)
/(auth)/sign-in           Clerk sign-in
/(auth)/sign-up           Clerk sign-up
/api/users                User CRUD
/api/clerk-webhook        Clerk event sync
/api/hume-token           Hume AI token endpoint
/api/sync-users           Bulk user sync
/dashboard/job-tracker    Kanban job tracker (NEW, JT4)
```

---

## Job Tracker Extension (Complete)

A full kanban-style job application tracker integrated into the DeepPivot platform, adapted from a MongoDB/React tutorial into our Drizzle/PostgreSQL/Clerk stack. All 7 phases shipped.

### Completed

- [x] **JT1: Database Schema** (`deeppivot-1`, P0) — Drizzle models for `job_boards`, `job_columns`, `job_applications` with cascade foreign keys, text[] tags, and workflow traceability. Migration `0002` applied to Neon.
- [x] **JT2: Auth Hooks & Default Board Init** (`deeppivot-2`, P1) — `initializeJobBoard()` server action creates "Automated Job Hunt" board with 5 default columns. Hooked into both Clerk webhook (`user.created`) and `POST /api/users` (client-side fallback). Idempotent — safe to call multiple times.
- [x] **JT3a: Epicflow Native Node Configuration** (`deeppivot-3`, P0) — Integration type system (`IntegrationConfig`, `ConfigField`, `NodeExecutionContext`). Job Tracker node config with 8 fields and mustache placeholders. Integration registry with `getIntegration()`, `getAllIntegrations()`, `executeNode()`.
- [x] **JT3b: Workflow Execution Engine** (`deeppivot-4`, P1) — `executeJobTrackerNode()` creates job applications from workflow triggers. Order-math (+100 spacing), tag splitting, required field validation. Wired into integration registry dispatcher.
- [x] **JT4: Dashboard UI & Kanban Shell** (`deeppivot-5`, P1) — Full Kanban UI at `/dashboard/job-tracker`. Server page with Clerk auth + Drizzle relational query. `KanbanBoard` (horizontal scrollable columns with color-coded headers), `JobApplicationCard` (dropdown with Edit/Move To/Delete), `CreateJobDialog` and `EditJobDialog` (grid-layout forms). 9 Shadcn components installed.
- [x] **JT5: Server Actions** (`deeppivot-6`, P0) — 4 server actions in `src/lib/actions/job-applications.ts`: `createJobApplication`, `updateJobApplication`, `deleteJobApplication`, `moveJobApplication`. All with order-math (+100 spacing), tag comma-splitting, and `revalidatePath`.

- [x] **JT6: Drag & Drop** (`deeppivot-7`, P1) — Full dnd-kit integration (`@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2`). `DndContext` with `closestCorners` collision detection and `PointerSensor` (8px activation). `SortableContext` per column with `verticalListSortingStrategy`. `SortableJobCard` wrapper with `useSortable` hook. `DroppableColumn` with `useDroppable` and visual hover feedback. `DragOverlay` with 2deg rotation and 90% opacity. Optimistic UI via local React state with server-state sync on prop change. Order-math: midpoint insertion between items, +100 spacing at edges. Cross-column drag via `handleDragOver`, same-column reorder via `arrayMove` in `handleDragEnd`. Background `updateJobApplication` server action call to persist.

- [x] **JT7: E2E Testing & Synergy Review** (`deeppivot-8`, P2) — Production build passes (`npm run build` clean). Fixed pre-existing `MicFFT.tsx` AutoSizer type incompatibility with React 18 JSX types. Dark mode audit: all job tracker components use Shadcn semantic tokens (`bg-background`, `bg-muted/30`, `text-muted-foreground`, `border-input`, `ring-primary/20`); column accent colors use Tailwind `-500` palette which renders correctly in both modes. Workflow pipeline verified end-to-end: Clerk webhook `user.created` -> user insert -> `initializeJobBoard()` -> board + 5 columns; `executeNode("job_tracker", ctx)` -> `executeJobTrackerNode()` -> order-math -> Drizzle insert -> kanban display via relational query.

### Dependency Graph (All Complete)

```
JT1 (DONE) ──┬──> JT2 (DONE) ────────────────────────> JT7 (DONE)
              ├──> JT3a (DONE) ──> JT3b (DONE) ────────> JT7 (DONE)
              ├──> JT4 (DONE) ──> JT5 (DONE) ──> JT6 (DONE) ──> JT7 (DONE)
              └──> JT5 (also needs JT4)
```

---

## Tech-Stack Translation Notes

The original tutorial used MongoDB/Mongoose/Better Auth. Here's what changed:

| Tutorial Stack | DeepPivot Stack | Notes |
|---|---|---|
| Prisma + MongoDB | Drizzle ORM + Neon PostgreSQL | `pgTable()` with `relations()` |
| CUIDs for PKs | `integer().generatedAlwaysAsIdentity()` | Matches existing `usersTable` pattern |
| `String[]` (Prisma) | `text().array()` (Drizzle pg-core) | Native PostgreSQL text arrays |
| Better Auth hooks | Clerk webhook + provider sync | JT2 hooks into Clerk `user.created` webhook + `/api/users` POST |
| `prisma migrate dev` | `drizzle-kit generate` + `drizzle-kit migrate` | Migration files in `drizzle/` |
| API Routes for CRUD | Next.js Server Actions | `"use server"` functions with `revalidatePath` |

---

## Future Considerations

- **Workflow Model**: `workflowId` on `job_applications` is currently a plain varchar. When the Workflow model lands, add a proper FK relation.
- **Shadcn Setup**: Installed — card, dialog, dropdown-menu, input, textarea, badge, label, separator, scroll-area.
- **dnd-kit**: Installed — `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2`.
