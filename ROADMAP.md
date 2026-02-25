# DeepPivot Roadmap

> **Project**: Career development platform with AI voice interviews, job tracking, career archetyping, and workforce development tools.  
> **Task tracking**: `bd ready` | `bd show <id>` | Issues in `.beads/issues.jsonl`

---

## Project Overview

DeepPivot helps users practice interviews with AI, track job applications, discover career archetypes, build career roadmaps, connect with mentors, and explore alternative education (bootcamps, certifications, funding). The landing page promises:

- **AI Voice Interviews** — Practice with Sarah, an ElevenLabs Conversational AI voice coach, with emotion-aware feedback and &lt;800ms latency
- **Emotional Intelligence Feedback** — Feedback on emotional responses, communication style, and confidence
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
| Framework | Next.js 16.1 (App Router, Turbopack) | Live |
| Database | PostgreSQL on Neon | Live |
| ORM | Drizzle ORM 0.44 | Live |
| Auth | Clerk (webhook + client sync) | Live |
| AI Voice | ElevenLabs Conversational AI (Sarah voice coach) | MVP live (v2; replaces earlier Hume prototype) |
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
- **archetype_review_queue** — Admin human review queue for AI-assigned archetypes (input, output, approve/override) (deeppivot-92)
- **career_milestones** — Per-user draggable roadmap milestones with title, dates, status, and order (LP7)
- **career_resources** — Resources linked to milestones (title, url, type: article/course/tool/video) (LP7)
- **mentors** — Seeded mentor directory (12 profiles) with expertise array, industry, bio, links (LP8)
- **mentor_connections** — User → mentor connection requests with status tracking (LP8)
- **education_programs** — 28 seeded programmes (bootcamps, certs, degrees, workshops) with ROI scores (LP9)
- **funding_opportunities** — 9 seeded funding sources (grants, scholarships, loans, ISAs) with eligibility and deadlines (LP9)

### Existing Routes

```
/                         Landing page (Deep Pivot marketing + ElevenLabs voice coach positioning)
/(auth)/sign-in           Clerk sign-in
/(auth)/sign-up           Clerk sign-up
/api/users                User CRUD + Clerk user sync
/api/users/current        Get current user profile
/api/clerk-webhook        Clerk event sync
/api/clerk-js             Clerk JS loader (prod proxy)
/api/clerk-proxy/[...path] Clerk proxy (prod)
/api/plans                Career plan CRUD (milestones)
/api/plans/[id]           Single plan CRUD
/api/plans/[id]/resources Milestone resources CRUD
/api/plans/[id]/resources/[resourceId]  Resource delete/update
/api/plans/[id]/resources/recommendations  Curated resource recommendations
/api/plans/reorder        Reorder milestones in a plan
/api/archetype/classify   BERT/LLM archetype classification proxy
/api/elevenlabs-signed-url  Signed URL for ElevenLabs ConvAI WebSocket
/api/elevenlabs-agent-info  Helper to introspect ElevenLabs agent config
/api/inngest              Inngest event handler (recording/feedback jobs)
/api/webhooks/vapi        Legacy Vapi webhook (v1 pipeline; kept for reference)
/api/sync-users           Bulk user sync
/api/admin/archetype-review        Admin: list archetype review queue (GET)
/api/admin/archetype-review/[id]   Admin: approve/override (PATCH)

/admin                    Admin dashboard (admin role only)
/admin/archetype-review   Admin: human review queue for archetypes

/dashboard                Authenticated learner dashboard shell
/dashboard/interviews     Interview sessions list + “Start Practice Session”
/dashboard/interviews/session      Live interview room (ElevenLabs ConvAI)
/dashboard/interviews/[sessionId]  Session detail
/dashboard/interviews/[sessionId]/feedback  Post‑interview feedback view
/dashboard/job-tracker    Kanban job tracker (JT4)
/dashboard/career-plan    Career plan builder (LP7)
/dashboard/archetype      Career archetype result + strengths/growth areas
/dashboard/mentors        Mentor directory + connection flow
/dashboard/education      Education Explorer (programs + funding)
/dashboard/analytics      Performance & skills analytics (LP5 shell)
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
| ~~deeppivot-24~~ | ~~Backend: Set up Cloudflare R2 for Storage~~ ✓ |
| ~~deeppivot-19~~ | ~~Frontend: Initialize Next.js 15 Project~~ ✓ |
| ~~deeppivot-20~~ | ~~Frontend: Integrate Shadcn UI~~ ✓ |
| ~~deeppivot-21~~ | ~~Backend: Provision Neon Postgres Database~~ ✓ |
| ~~deeppivot-22~~ | ~~Backend: Configure Drizzle ORM~~ ✓ |
| ~~deeppivot-23~~ | ~~DB Schema: Users and Profiles~~ ✓ |
| ~~deeppivot-25~~ | ~~Auth: Implement User Authentication (Clerk)~~ ✓ |
| ~~deeppivot-104~~ | ~~Frontend: Global Notification Toasts~~ ✓ |
| ~~deeppivot-107~~ | ~~Frontend: Custom 500 Error Page~~ ✓ |
| ~~deeppivot-112~~ | ~~Frontend: Global Footer Component~~ ✓ |
| ~~deeppivot-128~~ | ~~SEO: Create robots.txt~~ ✓ |
| ~~deeppivot-106~~ | ~~Frontend: Custom 404 Page~~ ✓ |
| ~~deeppivot-123~~ | ~~Performance: Image Optimization~~ ✓ |
| ~~deeppivot-125~~ | ~~Scaling: Theming for White-Labeling~~ ✓ |

Run `bd ready` to see current ready work. Theming (deeppivot-125) complete.

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
| 6 | ~~deeppivot-17~~ | ~~LP9: Alternative Education Explorer~~ ✓ |
| 7 | ~~deeppivot-68~~ | ~~Frontend: Learner Dashboard UI~~ ✓ |
| 8 | ~~deeppivot-116~~ | ~~Frontend: Career Plan Progress Widget~~ ✓ |
| 9 | ~~deeppivot-71~~ | ~~Feature: First-Time User Onboarding Flow~~ ✓ |
| 10 | ~~deeppivot-72~~ | ~~Feature: Returning User Dashboard Flow~~ ✓ |

**Phase 1 Status: COMPLETE ✓** — All 10 features shipped (LP1–LP9, Learner Dashboard, Career Plan Widget, Onboarding, Returning User Flow).

**Unblocks**: LP3–LP5 (interview flow), plus all dashboard-dependent features.

---

### Phase 2: AI Voice Interview Pipeline

**Goal**: End-to-end interview practice with a real-time voice coach.  
**Stack v2**: ElevenLabs Conversational AI (Sarah), ElevenLabs TTS/STT, LLM for feedback.

| Order | Issue | Title |
|-------|-------|-------|
| 1 | ~~deeppivot-10~~ | ~~LP2: Interview Session DB (from Phase 1)~~ ✓ |
| 2 | ~~deeppivot-11~~ | ~~LP3: AI Voice Interview Session Page~~ ✓ |
| 3 | ~~deeppivot-12~~ | ~~LP4: Interview History & Emotion Feedback Reports~~ ✓ |
| 4 | ~~deeppivot-13~~ | ~~LP5: Real-time Performance Analytics Dashboard~~ ✓ |

---

### Phase 3: Voice & AI Services

**Goal**: Orchestrate external voice/LLM services for scalable interview sessions.  
**Note**: Original plan used Vapi + Deepgram + Hume; production path has consolidated onto ElevenLabs ConvAI + LLM services, while keeping these issues as historical context.

| Order | Issue | Title |
|-------|-------|-------|
| 1 | ~~deeppivot-35~~ | ~~Backend: Vapi Integration Service~~ ✓ |
| 2 | ~~deeppivot-36~~ | ~~Backend: Deepgram Integration Service~~ ✓ |
| 3 | ~~deeppivot-37~~ | ~~Backend: Hume.ai Integration Service~~ ✓ |
| 4 | ~~deeppivot-38~~ | ~~Backend: TTS Integration Service (ElevenLabs/PlayHT)~~ ✓ |
| 5 | ~~deeppivot-39~~ | ~~Backend: LLM Orchestration Service (GPT-4/Claude-3)~~ ✓ |
| 6 | ~~deeppivot-40~~ | ~~Backend: Core Interview Session Handler~~ ✓ |

---

### Phase 4: Post-Interview & Career Archetyping

**Goal**: Feedback, emotion analysis, career archetype engine.

| Order | Issue | Title |
|-------|-------|-------|
| 1 | ~~deeppivot-44~~ | ~~Backend: Inngest Job for Recording Processing~~ ✓ |
| 2 | ~~deeppivot-45~~ | ~~Backend: Inngest Job for Transcription~~ ✓ |
| 3 | ~~deeppivot-46~~ | ~~Backend: Inngest Job for Emotional Analysis~~ ✓ |
| 4 | ~~deeppivot-47~~ | ~~Backend: Feedback Generation Engine (LLM)~~ ✓ |
| 5 | ~~deeppivot-48~~ | ~~Frontend: Display Interview Feedback UI~~ ✓ |
| 6 | ~~deeppivot-49~~ | ~~Frontend: Emotion-Aware Feedback Animations~~ ✓ |
| 7 | ~~deeppivot-56~~ | ~~AI/ML: Deploy and Integrate Custom BERT Model~~ ✓ |
| 8 | ~~deeppivot-57~~ | ~~Backend: Career Archetyping Engine~~ ✓ |
| 9 | ~~deeppivot-58~~ | ~~Frontend: Display Career Archetype~~ ✓ |
| 10 | ~~deeppivot-59~~ | ~~Backend: Map Interview to Career Skills~~ ✓ |
| 11 | ~~deeppivot-60~~ | ~~Frontend: Career Plan Draggable Timeline UI~~ ✓ |
| 12 | ~~deeppivot-61~~ | ~~Backend: Career Plan CRUD APIs~~ ✓ |
| 13 | ~~deeppivot-62~~ | ~~Frontend: Connect Career Plan UI to Backend~~ ✓ |
| 14 | ~~deeppivot-115~~ | ~~Feature: Career Plan Goal Completion~~ ✓ |
| 15 | ~~deeppivot-63~~ | ~~Feature: Printable/Shareable Career Plans~~ ✓ |
| 16 | ~~deeppivot-74~~ | ~~Backend: Emotion Inference Fallback Logic~~ ✓ |
| 17 | ~~deeppivot-117~~ | ~~Feature: Curated Resource Recommendations~~ ✓ |
| 18 | ~~deeppivot-96~~ | ~~AI/ML: Predictive Career Analytics~~ ✓ |
| 19 | ~~deeppivot-95~~ | ~~AI/ML: Adaptive Feedback Engine~~ ✓ |
| 20 | ~~deeppivot-91~~ | ~~AI/ML: Archetype Model Bias Detection~~ ✓ |
| 21 | ~~deeppivot-92~~ | ~~Admin: Human Review Queue for Archetypes~~ ✓ |

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

*Last updated: 2026-02-22 — deeppivot-125 (Theming for White-Labeling) closed. CSS variables for colors, fonts, spacing, radius; app/themes/employer-example.css. Run `bd ready` for next work.*
*Last updated: 2026-02-24 — ElevenLabs Conversational AI interview room (Sarah behavioral coach) integrated; dashboard shell, career archetype engine, career plan builder, mentors, and education explorer wired into the unified dashboard.*
*Last updated: 2026-02-25 — deeppivot-20 (Shadcn UI) closed. components.json configured (new-york style, neutral base, cssVariables), 14 components in components/ui/. Run `bd ready` for next work.*
*Last updated: 2026-02-25 — deeppivot-21 (Neon Postgres) closed. DATABASE_URL live on us-west-2 Neon pooler, @neondatabase/serverless installed, Drizzle connected, 10 migrations applied.*
*Last updated: 2026-02-25 — deeppivot-22 (Drizzle ORM) closed. drizzle-orm ^0.44.2 + drizzle-kit ^0.31.4 + pg ^8.8.0 installed; drizzle.config.ts configured; db:generate/migrate/push/studio scripts present.*
*Last updated: 2026-02-25 — deeppivot-23 (DB Schema: Users and Profiles) closed. usersTable defined with Clerk sync, role/status flags, credits system, and full Drizzle relations across 14 tables (job tracker, interviews, archetypes, career plan, mentors, education).*
*Last updated: 2026-02-25 — deeppivot-25 (Auth) closed. Clerk (@clerk/nextjs ^6.38.1) implemented: clerkMiddleware in proxy.ts, sign-in/sign-up pages with SSO callbacks, currentUser() dashboard guard, Clerk webhook → Neon DB sync.*
