# DeepPivot Roadmap

> **Project**: Career development platform with AI voice interviews, job tracking, career archetyping, and workforce development tools.  
> **Task tracking**: `bd ready` | `bd show <id>` | Issues in `.beads/issues.jsonl`

---

## Project Overview

DeepPivot helps users practice interviews with AI, track job applications, discover career archetypes, build career roadmaps, connect with mentors, and explore alternative education (bootcamps, certifications, funding). The landing page promises:

- **AI Voice Interviews** — Practice with Hume AI, emotion detection, &lt;800ms latency
- **Emotional Intelligence Feedback** — Feedback on emotional responses and communication style
- **Performance Analytics** — Track progress on interview performance and emotional growth
- **Career Archetype** — AI-powered behavioral trait modeling and NLP analysis
- **Career Planning** — Draggable timelines, milestones, curated resources
- **Mentor Network** — Industry mentors and workforce development partners
- **Education Explorer** — 500+ bootcamps, certifications, funding with ROI analysis

---

## What We Have Today

### Core Platform (Shipped)

| Layer | Tech | Status |
|-------|------|--------|
| Framework | Next.js 14.2 (App Router) | Live |
| Database | PostgreSQL on Neon | Live |
| ORM | Drizzle ORM 0.44 | Live |
| Auth | Clerk (webhook + client sync) | Live |
| AI Voice | Hume EVI integration | Live |
| UI | Shadcn UI + Radix + Tailwind CSS 4 | Live |
| Hosting | Vercel | Live |

### Database Models

- **users** — Full user profile with Clerk sync, credits system, role/status flags
- **job_boards** — Per-user kanban boards (JT1)
- **job_columns** — Ordered columns within boards (JT1)
- **job_applications** — Job cards with tags, status, order, workflow traceability (JT1)
- **interview_sessions** — Per-user interview sessions with type, status, score (LP2)
- **interview_questions** — Ordered questions per session with response quality score (LP2)
- **emotion_snapshots** — JSONB emotion maps captured during a session with dominant emotion & confidence (LP2)
- **career_archetypes** — Per-user archetype result with name, JSONB trait scores, strengths, and growth areas (LP6)
- **career_milestones** — Per-user draggable roadmap milestones with title, dates, status, and order (LP7)
- **career_resources** — Resources linked to milestones (title, url, type: article/course/tool/video) (LP7)
- **mentors** — Seeded mentor directory (12 profiles) with expertise array, industry, bio, links (LP8)
- **mentor_connections** — User → mentor connection requests with status tracking (LP8)

### Existing Routes

```
/                         Landing page (Hume AI chat)
/(auth)/sign-in           Clerk sign-in
/(auth)/sign-up           Clerk sign-up
/api/users                User CRUD
/api/clerk-webhook        Clerk event sync
/api/hume-token           Hume AI token endpoint
/api/sync-users           Bulk user sync
/dashboard/job-tracker    Kanban job tracker (JT4)
```

---

## Job Tracker (Complete)

Full kanban-style job application tracker. All 7 phases shipped.

| Phase | Issue | Description |
|-------|-------|-------------|
| JT1 | deeppivot-1 | Drizzle schema: `job_boards`, `job_columns`, `job_applications` |
| JT2 | deeppivot-2 | Auth hooks, default board init (Clerk webhook + `/api/users`) |
| JT3a | deeppivot-3 | Epicflow node config, integration registry |
| JT3b | deeppivot-4 | Workflow execution engine (`executeJobTrackerNode`) |
| JT4 | deeppivot-5 | Kanban UI, Create/Edit dialogs, Shadcn components |
| JT5 | deeppivot-6 | Server actions: create, update, delete, move |
| JT6 | deeppivot-7 | dnd-kit drag & drop, optimistic UI |
| JT7 | deeppivot-8 | E2E testing, dark mode audit, build verification |

---

## Upcoming Steps

### Next Up (Ready Now)

| ID | Title |
|----|-------|
| **deeppivot-17** | LP9: Alternative Education Explorer |
| **deeppivot-18** | Project: Initialize GitHub Repository |

Run `bd ready` to see current ready work. Start with **deeppivot-17** — Education Explorer completes Phase 1.

---

### Phase 1: Foundation & Dashboard

**Goal**: Shared dashboard shell so all features have a home.

| Order | Issue | Title |
|-------|-------|-------|
| 1 | ~~deeppivot-9~~ | ~~LP1: Dashboard Shell & Sidebar Navigation~~ ✓ |
| 2 | ~~deeppivot-10~~ | ~~LP2: Interview Session Database Models & Migration~~ ✓ |
| 3 | ~~deeppivot-14~~ | ~~LP6: Career Archetype Assessment~~ ✓ |
| 4 | ~~deeppivot-15~~ | ~~LP7: Personalized Career Planning & Roadmap~~ ✓ |
| 5 | ~~deeppivot-16~~ | ~~LP8: Mentor & Coach Network~~ ✓ |
| 6 | deeppivot-17 | LP9: Alternative Education Explorer |

**Unblocks**: LP3–LP5 (interview flow), plus all dashboard-dependent features.

---

### Phase 2: AI Voice Interview Pipeline

**Goal**: End-to-end interview practice with Hume AI.

| Order | Issue | Title |
|-------|-------|-------|
| 1 | ~~deeppivot-10~~ | ~~LP2: Interview Session DB (from Phase 1)~~ ✓ |
| 2 | ~~deeppivot-11~~ | ~~LP3: AI Voice Interview Session Page~~ ✓ |
| 3 | ~~deeppivot-12~~ | ~~LP4: Interview History & Emotion Feedback Reports~~ ✓ |
| 4 | ~~deeppivot-13~~ | ~~LP5: Real-time Performance Analytics Dashboard~~ ✓ |

---

### Phase 3: Voice & AI Services

**Goal**: Vapi, Deepgram, Hume, TTS, LLM orchestration for scalable interview sessions.

| Order | Issue | Title |
|-------|-------|-------|
| 1 | deeppivot-35 | Backend: Vapi Integration Service |
| 2 | deeppivot-36 | Backend: Deepgram Integration Service |
| 3 | deeppivot-37 | Backend: Hume.ai Integration Service |
| 4 | deeppivot-38 | Backend: TTS Integration Service (ElevenLabs/PlayHT) |
| 5 | deeppivot-39 | Backend: LLM Orchestration Service (GPT-4/Claude-3) |
| 6 | deeppivot-40 | Backend: Core Interview Session Handler |

---

### Phase 4: Post-Interview & Career Archetyping

**Goal**: Feedback, emotion analysis, career archetype engine.

| Order | Issue | Title |
|-------|-------|-------|
| 1 | deeppivot-41 | Backend: Inngest Job for Recording Processing |
| 2 | deeppivot-42 | Backend: Inngest Job for Transcription |
| 3 | deeppivot-43 | Backend: Inngest Job for Emotional Analysis |
| 4 | deeppivot-44 | Backend: Feedback Generation Engine (LLM) |
| 5 | deeppivot-45 | Frontend: Display Interview Feedback UI |
| 6 | deeppivot-46 | Frontend: Emotion-Aware Feedback Animations |
| 7 | deeppivot-50 | AI/ML: Deploy and Integrate Custom BERT Model |
| 8 | deeppivot-51 | Backend: Career Archetyping Engine |

---

### Phase 5: DevOps, Security & Polish

**Goal**: Deployment, monitoring, security, and UX polish.

| Order | Issue | Title |
|-------|-------|-------|
| 1 | deeppivot-48 | DevOps: Configure Vercel Deployment |
| 2 | deeppivot-49 | DevOps: Set up GitHub Actions CI/CD |
| 3 | deeppivot-52 | Security: PII Anonymization Pipeline |
| 4 | deeppivot-53 | Security: API Rate Limiting |
| 5 | deeppivot-54 | Security: Configure HTTP Security Headers |
| 6 | deeppivot-55 | Frontend: Ensure WCAG-AA Color Contrast |
| 7 | deeppivot-56 | Frontend: Implement Keyboard Navigation |
| 8 | deeppivot-125 | Performance: Pre-launch Load Test |

---

## Dependency Graph

```
LP1 (dashboard) ──┬──> LP2 ──> LP3 ──> LP4 ──> LP5
                 ├──> LP6, LP7, LP8, LP9
                 └──> Most frontend tasks

Interview pipeline depends on: LP2 (DB), Vapi (35), Hume (37), TTS (38), LLM (39)
```

---

## Task Tracking

```bash
bd ready              # Find next work
bd show deeppivot-9   # Inspect issue
bd update deeppivot-9 --status in_progress
bd close deeppivot-9
bd blocked            # See blocked issues
bd sync               # Sync at session end
```

Full plan and issue details: `PLAN.md` | `.beads/issues.jsonl`

---

## Tech-Stack Notes

| Original (Tutorial) | DeepPivot | Notes |
|---------------------|-----------|-------|
| Prisma + MongoDB | Drizzle ORM + Neon PostgreSQL | `pgTable()`, `relations()` |
| Better Auth | Clerk | Webhook + `/api/users` sync |
| API Routes | Server Actions | `"use server"`, `revalidatePath` |
| `prisma migrate` | `drizzle-kit generate` + `migrate` | `drizzle/` migrations |

**Future**: `workflowId` on `job_applications` is varchar; add FK when Workflow model lands.

---

*Last updated: 2026-02-22 — deeppivot-16 (LP8: Mentor & Coach Network) closed. New: `mentors` + `mentor_connections` tables (migration `0006_living_maximus.sql`), 12 seeded mentor profiles, `MentorCard` with connect dialog, `MentorGrid` with client-side search + industry/expertise filters.*
