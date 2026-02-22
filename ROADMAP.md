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
```

---

## What We're Building: Job Tracker Extension

A full kanban-style job application tracker integrated into the DeepPivot platform, adapted from a MongoDB/React tutorial into our Drizzle/PostgreSQL/Clerk stack.

### Completed

- [x] **JT1: Database Schema** (`deeppivot-1`, P0) — Drizzle models for `job_boards`, `job_columns`, `job_applications` with cascade foreign keys, text[] tags, and workflow traceability. Migration `0002` applied to Neon.
- [x] **JT2: Auth Hooks & Default Board Init** (`deeppivot-2`, P1) — `initializeJobBoard()` server action creates "Automated Job Hunt" board with 5 default columns. Hooked into both Clerk webhook (`user.created`) and `POST /api/users` (client-side fallback). Idempotent — safe to call multiple times.

### Up Next (Unblocked)

- [ ] **JT3a: Epicflow Native Node Configuration** (`deeppivot-3`, P0) — Define the Job Tracker as a visual node in the Epicflow canvas. Config fields for Board, Column, Company, Position with mustache template support.
- [ ] **JT4: Dashboard UI & Kanban Shell** (`deeppivot-5`, P1) — Protected `/dashboard/job-tracker` route. KanbanBoard, JobApplicationCard, Create/Edit dialogs, dropdown menus using Shadcn components.

### Blocked (Waiting on Dependencies)

- [ ] **JT3b: Workflow Execution Engine** (`deeppivot-4`, P1) — Blocked by JT3a. The `executeJobTrackerNode` function that creates job applications from workflow triggers.
- [ ] **JT5: Server Actions** (`deeppivot-6`, P0) — Blocked by JT4. CRUD server actions (`createJobApplication`, `updateJobApplication`, `deleteJobApplication`) with session validation and order-math spacing.
- [ ] **JT6: Drag & Drop** (`deeppivot-7`, P1) — Blocked by JT4 + JT5. Full dnd-kit integration with `DndContext`, `SortableContext`, optimistic UI, and the order-math algorithm.
- [ ] **JT7: E2E Testing** (`deeppivot-8`, P2) — Blocked by everything. Webhook pipeline test, dark mode validation, TypeScript build verification.

### Dependency Graph

```
JT1 (DONE) ──┬──> JT2 (DONE) ────────────────> JT7
              ├──> JT3a ──> JT3b ─────────────> JT7
              ├──> JT4 ──> JT5 ──> JT6 ──────> JT7
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
- **Shadcn Setup**: Several Shadcn components need to be installed (dialog, card, dropdown-menu, badge, input, textarea) before JT4.
- **dnd-kit**: Packages `@dnd-kit/core`, `@dnd-kit/utilities`, `@dnd-kit/sortable` need to be installed before JT6.
