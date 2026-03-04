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
- **user_gamification** — Per-user points, currentStreak, highestStreak for Phase 16.4 gamification
- **user_badges** — Per-user unlocked badges with unique(userId, badgeId) constraint (Phase 16.4)
- **gamification_events** — Audit log of all gamification point awards with eventType, points, metadata JSONB (Phase 16.4)
- **matching_feedback** — Application outcomes (hired/rejected) with signals for weight learning (Phase 16.5)
- **matching_weights** — Configurable weights updated by feedback aggregation (Phase 16.5)

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
/api/notifications                 Phase 16.3: notifications (GET, auth required)
/api/notifications/read-all        Phase 16.3: mark all as read (PATCH, auth required) (deeppivot-243)
/api/notifications/stream         Phase 16.3: SSE real-time stream (GET, auth required) (deeppivot-244)
/api/admin/announcements           Phase 16.3: admin broadcast (POST, admin only)
/api/gamification/status           Phase 16.4: gamification status (GET, auth required) (deeppivot-269)

/admin                  ### 6. Admin Panel Hooks & Review Dashboard
- Tools for admins/coaches to review AI transcripts and user performance.
- Moderation tools for user-submitted content if necessary.
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
| ~~deeppivot-26~~ | ~~Frontend: Build Auth Forms (Login/Register)~~ ✓ |
| ~~deeppivot-27~~ | ~~Auth: Implement Role-Based Access Control (RBAC)~~ ✓ |
| ~~deeppivot-28~~ | ~~Backend: Set up Inngest for Background Jobs~~ ✓ |
| ~~deeppivot-29~~ | ~~DB Schema: Interviews and Feedback~~ ✓ |
| ~~deeppivot-30~~ | ~~DB Schema: Career Plans, Goals, Archetypes~~ ✓ |
| ~~deeppivot-31~~ | ~~DB Schema: Subscriptions and Agent Config~~ ✓ |
| ~~deeppivot-32~~ | ~~DevOps: Configure Vercel Deployment~~ ✓ |
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
| 1 | ~~deeppivot-32~~ | ~~DevOps: Configure Vercel Deployment~~ ✓ |
| 2 | ~~deeppivot-33~~ | ~~DevOps: Set up GitHub Actions CI/CD~~ ✓ |
| 3 | ~~deeppivot-67~~ | ~~Security: PII Anonymization Pipeline~~ ✓ |
| 4 | ~~deeppivot-109~~ | ~~Security: API Rate Limiting~~ ✓ |
| 5 | ~~deeppivot-110~~ | ~~Security: Configure HTTP Security Headers~~ ✓ |
| 6 | ~~deeppivot-50~~ | ~~Frontend: Ensure WCAG-AA Color Contrast~~ ✓ |
| 7 | ~~deeppivot-51~~ | ~~Frontend: Implement Keyboard Navigation~~ ✓ |
| 8 | ~~deeppivot-142~~ | ~~Performance: Pre-launch Load Test~~ ✓ |
| 9 | ~~deeppivot-182~~ | ~~DevOps: CI/CD hardening — migration check, Playwright artifacts, npm caching~~ ✓ |

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
*Last updated: 2026-02-25 — deeppivot-26 (Auth Forms) closed. Sign-in and sign-up pages built with Shadcn Button/Input: email/password, Google OAuth, email verification flow, typed error handling, loading states, dark mode.*
*Last updated: 2026-02-25 — deeppivot-27 (RBAC) implemented. src/lib/rbac.ts: AppRole (admin/employer/user), requireRole/requireAdmin/requireEmployer/requireLearner/getCurrentUser/hasRole. proxy.ts: admin + employer route matchers with DB role check → /unauthorized redirect. app/unauthorized/page.tsx created.*
*Last updated: 2026-02-25 — deeppivot-28 (Inngest) closed. inngest ^3.52.3 installed; client, 5 production functions (recording → transcription → emotion → feedback → archetyping), and /api/inngest route all live.*
*Last updated: 2026-02-25 — deeppivot-29 (DB Schema: Interviews and Feedback) closed. All 7 interview tables present: interview_sessions, interview_questions, emotion_snapshots, recording_urls, transcript_urls, emotional_analysis, interview_feedback. Full FK + Drizzle relations wired.*
*Last updated: 2026-02-25 — deeppivot-30 (DB Schema: Career Plans, Goals, Archetypes) closed. Tables present: career_archetypes, archetype_review_queue, career_milestones, career_resources. Full FK + Drizzle relations wired.*
*Last updated: 2026-02-25 — deeppivot-31 (DB Schema: Subscriptions and Agent Config) implemented. subscriptions and agent_configs tables added to schema.ts; migration 0014 generated and applied to Neon.*
*Last updated: 2026-02-25 — deeppivot-32 (Vercel Deployment) implemented. vercel.json, next.config.js (security headers, image domains, compression), .vercelignore, and comprehensive .env.example created and pushed.*
*Last updated: 2026-02-25 — deeppivot-33 (GitHub Actions CI/CD) implemented. .github/workflows/ci.yml: lint + type-check + build jobs on push/PR to main; pnpm cache, concurrency cancel-in-progress. .github/pull_request_template.md added.*
*Last updated: 2026-02-25 — deeppivot-34 (Zustand + React Query) implemented. zustand 5.0.11 installed; src/store/ui.ts created with modal registry (ModalId enum, openModal/closeModal), sidebar toggle, and in-app notification queue. @tanstack/react-query was already installed and wired into app/provider.tsx via QueryProvider.*
*Last updated: 2026-02-25 — deeppivot-41 (Interview Session UI) closed. ElevenLabsInterviewRoom.tsx fully implements the voice interview page: session-type metadata, ElevenLabs WebSocket + signed URL, real-time status indicators (Connecting/Live/Sarah is speaking/Listening/Your turn), mute+end-call controls, live transcript panel, audio-level meter, Bluetooth mic warning, AudioWorklet PCM capture, and session-ended screen.*
*Last updated: 2026-02-25 — deeppivot-42 (Stream SDK Video) closed as out-of-scope. DeepPivot is intentionally voice-only via ElevenLabs; no video layer needed.*
*Last updated: 2026-02-25 — deeppivot-43 (Custom Voice-Agent Scripting) implemented. src/lib/actions/agent-configs.ts: full CRUD server actions (list/get/create/update/delete/resolveAgentConfig/upsertSystemPreset) for agent_configs table with ownership checks and isDefault deduplication. elevenlabs-signed-url route updated to resolve agent config by interviewType before falling back to env-var agent ID.*
*Last updated: 2026-02-25 — deeppivot-50 (WCAG-AA Color Contrast) implemented. --muted-foreground darkened to oklch(0.48) for ≥4.5:1 on all surfaces; --destructive darkened to oklch(0.5) and destructive-foreground set to white in both modes; :focus-visible ring and prefers-reduced-motion added to globals.css; skip-to-content link in layout.tsx; unauthorized page hardcoded slates upgraded; hero-section slate-400/600 → 700/300.*
*Last updated: 2026-02-25 — deeppivot-51 (Keyboard Navigation) implemented. Interview room: aria-label/aria-pressed/aria-busy/aria-hidden on all controls + role=toolbar; StartInterviewCTA: aria-label on cards + focus-visible ring; SessionCard: div→button with aria-pressed in edit mode; SessionsList: aria-expanded/aria-disabled + focus-visible rings; skip link upgraded to focus-visible: prefixes.*
*Last updated: 2026-02-25 — deeppivot-52 (Polar Billing) implemented. @polar-sh/sdk + @polar-sh/nextjs installed; src/lib/polar.ts: client singleton, PLANS config (free/pro/enterprise) with Polar product IDs; POST /api/billing/checkout creates checkout session; POST /api/webhooks/polar handles subscription.created/active/updated/canceled/revoked → upserts subscriptions table.*
*Last updated: 2026-02-26 — deeppivot-53 (Pricing & Billing UI) implemented. /pricing: public plan comparison page; /dashboard/billing: current plan card, upgrade card, enterprise CTA; UpgradeButton client component → Polar checkout redirect; /dashboard/billing/success: post-checkout confirmation; getUserSubscription() server action; Billing added to DashboardSidebar.*
*Last updated: 2026-02-26 — deeppivot-54 (Polar Webhook Handler) closed — already implemented in deeppivot-52 (subscription.created/active/updated/canceled/revoked handlers with signature verification).*
*Last updated: 2026-02-26 — deeppivot-55 (OpenAI Embeddings) implemented. src/lib/embeddings.ts: embedText(), embedBatch() (auto-batching), cosineSimilarity(), semanticSearch<T>() (parallel embed + rank), serializeEmbedding/deserializeEmbedding for DB storage. Uses text-embedding-3-small by default.*
*Last updated: 2026-02-26 — deeppivot-64 (Monitoring & Logging) implemented. Sentry: three config files + instrumentation.ts + next.config.js wrapped with withSentryConfig (tunnel, source maps, component annotations). PostHog: PHProvider + PageViewTracker in app/provider.tsx. Axiom: src/lib/logger.ts structured logger shipping to Axiom in production. All env vars added to .env.example.*
*Last updated: 2026-02-26 — deeppivot-65 (Global Replicas) and deeppivot-66 (Cloudflare CDN) closed as infra-only config tasks — no app code required. R2 uses Cloudflare edge by default; static/API cache headers already set in next.config.js.*
*Last updated: 2026-02-26 — deeppivot-67 (PII Anonymization) implemented. src/lib/pii.ts: anonymize(), containsPII(), anonymizeWithReport(), anonymizeObject<T>(). Covers email, phone, SSN, credit card, address, ZIP, IP, URL, DOB, names. Zero external deps.*
*Last updated: 2026-02-26 — deeppivot-69 (Mentor Dashboard) + deeppivot-70 (WDB Dashboard): RBAC-protected placeholder dashboards. src/lib/rbac.ts: getCurrentUserRole(), hasRole(), requireRole(), requireAdmin() + AuthorizedUser type. Mentor page at /dashboard/mentor (6 coming-soon cards). WDB partner page at /dashboard/wdb (6 coming-soon cards).*
*Last updated: 2026-02-26 — deeppivot-73 (Landing Page CTA) closed as already implemented: full landing page with HeroSection, FeatureBentoGrid, and auth-aware CTA redirecting to /sign-up or /dashboard/interviews.*
*Last updated: 2026-02-26 — deeppivot-75 (DB Connection Pooling): src/db/index.ts upgraded to @neondatabase/serverless Pool (max 10, configurable). Lazy singleton for Node.js runtime, falls back to neon-http in Edge runtime.*
*Last updated: 2026-02-26 — deeppivot-76 (Seed Archetypes): scripts/seed-archetypes.ts — 8 career archetypes with traits, strengths, growthAreas. deeppivot-77 (Seed Agent Configs): scripts/seed-agent-configs.ts — 5 public interview coach presets with detailed system prompts and ElevenLabs voice IDs.*
*Last updated: 2026-02-26 — deeppivot-78 (Alt-Ed Programs): scripts/seed-education-programs.ts — 502 programs across 15 categories (SE bootcamps, data science, UX/UI, cybersecurity, cloud/DevOps, PM, trades, healthcare, business, AI, and more). Maps to educationProgramsTable. Idempotent.*
*Last updated: 2026-02-26 — deeppivot-79 (Alt-Ed Explorer UI): /explorer/alt-ed page with AltEdExplorer client component. Real-time text search + program-type checkboxes + cost/ROI radio filters + tag toggles + sort options + responsive card grid + mobile filter drawer.*
*Last updated: 2026-02-26 — deeppivot-83 (Salesforce Integration): src/lib/salesforce.ts using jsforce. OAuth2 username-password flow, lazy singleton connection. findContactByEmail(), upsertLearnerContact(), searchAccounts(), createReferralOpportunity(), createReferralTask(), soqlQuery(), checkSalesforceConnection(). SALESFORCE_* env vars added to .env.example.*
*Last updated: 2026-02-26 — deeppivot-86/88/89 (Mentor Tools): Mentor dashboard upgraded from placeholder to functional tabbed interface. LearnersTab: getMentorLearners() + getLearnerSessions() with expandable SessionCard (recordings, transcripts, AI feedback). ReferralsTab: createMentorReferral()/getMentorReferrals() with referral form and history. ResourcesTab: addMentorResource()/getMentorResources()/deleteMentorResource() with curated resource library. src/lib/actions/mentor-tools.ts added.*
*Last updated: 2026-02-26 — deeppivot-93 (WebRTC Latency): Closed as N/A. DeepPivot uses ElevenLabs Conversational AI (not a Stream/WebRTC SDK). Latency is managed by ElevenLabs transport layer; direct WebRTC config is not applicable.*
*Last updated: 2026-02-26 — deeppivot-94 (RBAC Enterprise Manager): enterprise_manager added to UserRole type in src/lib/rbac.ts. ENTERPRISE_MANAGER_PERMISSIONS constant (cohort:read/export, sessions:read, insights:read). hasEnterprisePermission() helper. requireEnterpriseManager() guard with orgId from Clerk publicMetadata. EnterpriseManagerUser interface. app/dashboard/enterprise/page.tsx read-only dashboard.*
*Last updated: 2026-02-26 — deeppivot-97 (Storybook): @storybook/nextjs configured. .storybook/main.ts (story globs, addons: essentials, interactions, a11y) + .storybook/preview.ts (globals.css, Next.js appDirectory). Stories for Button (6 variants + icon/loading/disabled), Badge (4 variants + role examples), Card (default/stat/program), Input (text/search/disabled/password). Introduction.mdx design guide. pnpm storybook + pnpm build-storybook scripts added.*
*Last updated: 2026-02-26 — deeppivot-80 (Alt-Ed API): GET /api/alt-ed — paginated, filterable endpoint. Params: q, type, maxCost, minRoi, tags, sort, page, limit (max 100). Parallel COUNT + data queries. Returns { data, pagination } with hasNextPage/hasPrevPage.*
*Last updated: 2026-02-26 — deeppivot-81 (Alt-Ed ROI): src/lib/alt-ed-roi.ts calculateRoi() — net gain, ROI%, payback months, break-even year, summary. SALARY_BENCHMARKS for 14 career fields (BLS/LinkedIn 2025). Duration parser for weeks/months/years/hours. RoiCalculator.tsx modal wired into every program card.*
*Last updated: 2026-02-26 — deeppivot-82 (Funding Eligibility): matchFundingEligibility() cross-references funding sources against user profile (income, state, vet, dislocated, first-gen). FundingPanel.tsx inline collapsible component with eligibility form + matched results. Wired into every program card.*
*Last updated: 2026-02-26 — deeppivot-84 (Salesforce Sync): src/inngest/salesforce-sync.ts salesforceDailySync — cron 0 3 * * * + on-demand event trigger. Pulls Contacts modified in 25h window, matches by email, updates names, creates mentor connections from WDB referral field. Batched 25/step, rate-limited 1/24h, retries=3. Registered in /api/inngest.*
*Last updated: 2026-02-26 — deeppivot-87 (Mentor Feedback): mentor_feedback table added to schema (sessionId, mentorUserId, comment, rating 1-5, isPrivate). addMentorFeedback(), getMentorFeedbackForSession(), deleteMentorFeedback() actions with connection ownership validation.*
*Last updated: 2026-02-26 — deeppivot-98 (Responsive Layout): Closed as already implemented. app/dashboard/layout.tsx: flex-col/md:flex-row shell with DashboardSidebar + DashboardTopBar. Tailwind responsive breakpoints used throughout.*
*Last updated: 2026-02-26 — deeppivot-99 (Forgot Password) + deeppivot-100 (Google SSO): Both closed as handled by Clerk. Forgot Password is built into Clerk's auth flow (Clerk Dashboard → Email config). Google OAuth already wired via oauth_google strategy in both sign-in and sign-up pages.*
*Last updated: 2026-02-26 — deeppivot-101 (User Profile Settings): /dashboard/settings/profile page with avatar upload to R2, editable firstName/lastName/bio/phone/pronouns/linkedinUrl, read-only email field, role badge, and account deletion (soft delete). src/lib/actions/profile.ts: getUserProfile, updateProfile, uploadAvatar, softDeleteAccount, softDeleteInterviewSession, softDeleteMilestone. Settings link added to DashboardSidebar.*
*Last updated: 2026-02-26 — deeppivot-103 (Interview History): Closed as already implemented. /dashboard/interviews fully built with SessionsList, StartInterviewCTA, and session detail links.*
*Last updated: 2026-02-26 — deeppivot-105 (Soft Deletes): Added deletedAt: timestamp() to usersTable, interviewSessionsTable, careerMilestonesTable in schema.ts. Added avatarUrl, bio, phone, pronouns, linkedinUrl profile fields to usersTable. Added wdbSalesforceContactId, wdbCasePlanId, wdbEnrolledAt WDB integration fields. Profile actions filter deleted rows via isNull(deletedAt).*
*Last updated: 2026-02-26 — deeppivot-108 (Playwright E2E): playwright.config.ts with Chromium + iPhone 13 projects. e2e/landing.spec.ts, auth.spec.ts, alt-ed-explorer.spec.ts covering 15+ scenarios (page loads, redirects, form rendering, ROI modal, API responses). CI job added to ci.yml: runs on PRs, Playwright Chromium, uploads HTML report artifact. pnpm e2e / e2e:ci / e2e:ui scripts added.*
*Last updated: 2026-02-26 — deeppivot-109 (API Rate Limiting): src/lib/rate-limit.ts using @upstash/ratelimit + @upstash/redis. Sliding window algorithm. Named profiles: INTERVIEW_START (5/min), ELEVENLABS_URL (10/min), BILLING_CHECKOUT (3/min), ALT_ED_SEARCH (60/min), DEFAULT (30/min), AUTH (10/min), WEBHOOK (100/min), ADMIN (20/min). Wired into /api/elevenlabs-signed-url and /api/alt-ed. Graceful bypass when Redis env vars missing.*
*Last updated: 2026-02-26 — deeppivot-110 (HTTP Security Headers): next.config.js headers() enhanced with full CSP (Content-Security-Policy-Report-Only in dev, enforced in prod) covering all directives for ElevenLabs, Clerk, Sentry, PostHog, R2. HSTS (max-age=63072000 includeSubDomains preload) in production. Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy added. All existing headers retained.*
*Last updated: 2026-02-26 — deeppivot-85 (WDB Career Plan Sync): src/lib/actions/wdb-career-plan.ts with getWdbStatus, linkWdbRecord, createWdbAlignedMilestones, generateWdbMilestoneTemplates. 12 WIOA IEP goal categories with pre-built milestone templates. WdbCareerPlanBanner component on career-plan page shows for WDB clients with goal selector + credential input → auto-populates milestones. Inngest Salesforce sync now auto-links wdbSalesforceContactId on contact match.*
*Last updated: 2026-02-26 — deeppivot-90 (WDB Dashboard Visualizations): WDB dashboard rebuilt with real data. src/lib/actions/wdb-analytics.ts: getWdbCohortStats (total learners, sessions, completion rate, archetype coverage), getWdbArchetypeBreakdown (per-archetype counts), getWdbSessionTrend (30-day sparkline), getWdbMilestoneBreakdown (status donut). WdbChartsClient.tsx: CSS bar chart, SVG sparkline, SVG donut chart. No external charting library required.*

---

### Phase 6: Job Marketplace (Complete ✓)

**Goal**: Full two-sided job marketplace connecting employers and job-seeking learners.

| ID | Title | Status |
|----|-------|--------|
| ~~deeppivot-143~~ | ~~DB: companies table (schema + migration 0015)~~ | ✓ |
| ~~deeppivot-144~~ | ~~DB: jobs table (schema + migration 0015)~~ | ✓ |
| ~~deeppivot-145~~ | ~~DB: job_marketplace_applications table~~ | ✓ |
| ~~deeppivot-146~~ | ~~DB: Extend job_applications with marketplace linkage~~ | ✓ |
| ~~deeppivot-147~~ | ~~API: Companies CRUD routes~~ | ✓ |
| ~~deeppivot-148~~ | ~~API: Jobs CRUD routes~~ | ✓ |
| ~~deeppivot-149~~ | ~~API: Applications + Job Tracker sync~~ | ✓ |
| ~~deeppivot-150~~ | ~~Auth: Employer RBAC extension~~ | ✓ |
| ~~deeppivot-151~~ | ~~Frontend: Employer onboarding flow~~ | ✓ |
| ~~deeppivot-152~~ | ~~Frontend: Employer company profile page~~ | ✓ |
| ~~deeppivot-153~~ | ~~Frontend: Employer job posting form (JobForm component)~~ | ✓ |
| ~~deeppivot-154~~ | ~~Frontend: Employer job management dashboard~~ | ✓ |
| ~~deeppivot-155~~ | ~~Frontend: Employer application review dashboard~~ | ✓ |
| ~~deeppivot-156~~ | ~~Frontend: Job Marketplace listing page (/jobs)~~ | ✓ |
| ~~deeppivot-157~~ | ~~Frontend: Job search and filter UI (JobSearchFilters)~~ | ✓ |
| ~~deeppivot-158~~ | ~~Frontend: Job detail page (/jobs/[jobId])~~ | ✓ |
| ~~deeppivot-159~~ | ~~Frontend: Apply modal (ApplyModal)~~ | ✓ |
| ~~deeppivot-160~~ | ~~Frontend: Save job + saved jobs list~~ | ✓ |
| ~~deeppivot-161~~ | ~~Frontend: Dashboard nav — Job Marketplace~~ | ✓ |
| ~~deeppivot-162~~ | ~~Admin: Job moderation tools (/admin/jobs)~~ | ✓ |
| ~~deeppivot-163~~ | ~~Admin: Employer and company moderation (/admin/employers)~~ | ✓ |
| ~~deeppivot-164~~ | ~~Integration: Job Tracker — Via DeepPivot badge~~ | ✓ |
| ~~deeppivot-165~~ | ~~Integration: Post-interview job suggestions hook~~ | ✓ |
| ~~deeppivot-166~~ | ~~Integration: Career plan → marketplace job defaults~~ | ✓ |
| ~~deeppivot-167~~ | ~~QA & E2E: Job Marketplace end-to-end verification~~ | ✓ |

**New routes added:**

```
/jobs                         Job marketplace listing (SSR, filterable, paginated)
/jobs/[jobId]                 Job detail page (company sidebar, apply button, already-applied state)
/employer/onboarding          3-step employer onboarding wizard
/employer/jobs                Employer job management dashboard
/employer/jobs/new            Create new job posting
/employer/jobs/[jobId]/edit   Edit existing job posting
/employer/jobs/[jobId]/applications   Applicant review page with status-update panel
/admin/jobs                   Admin job moderation table
/admin/employers              Admin employer management table

/api/companies                GET (list) / POST (employer creates)
/api/companies/[id]           GET / PATCH
/api/jobs                     GET (filterable) / POST (employer)
/api/jobs/[jobId]             GET / PATCH / DELETE
/api/jobs/[jobId]/apply       POST (atomically creates application + tracker card)
/api/employer/jobs/[jobId]/applications  GET (employer views applicants)
/api/employer/jobs/[jobId]/invite        POST (employer invites candidate → sends "Employer invited you to apply" email)
/api/employer/applications/[appId]       PATCH (status update propagates to tracker)
/api/me/applications          GET (learner's own applications)
```

**New components:**
- `components/employer/JobForm.tsx` — reusable create/edit job form
- `components/jobs/JobSearchFilters.tsx` — debounced URL-synced filter panel
- `components/jobs/ApplyModal.tsx` — apply form with 409/410 error handling
- `JobApplicationCard.tsx` — updated with "✦ Via DeepPivot" badge for marketplace cards

**Phase 6 Status: COMPLETE ✓** — All 25 issues shipped. Build passes with `exit code 0`.

---

*Last updated: 2026-02-26 — Phase 6 (Job Marketplace) complete. 25 issues shipped: companies/jobs/applications DB schema (migration 0015), employer RBAC, employer onboarding + job management UI, job seeker marketplace listing/detail/apply flow, admin moderation pages, Job Tracker badge integration, E2E test spec. pnpm build exit 0.*

---

### Phase 7: Admin Dashboard, User Management & Agent Config (Complete ✓)

**Goal**: Give admins real-time platform stats, full user lifecycle control, and a CRUD interface for AI agent presets.

| ID | Title | Status |
|----|-------|--------|
| ~~deeppivot-118~~ | ~~Admin: Basic Dashboard UI~~ | ✓ |
| ~~deeppivot-119~~ | ~~Admin: User Management Feature~~ | ✓ |
| ~~deeppivot-120~~ | ~~Admin: Agent Configuration Management~~ | ✓ |

**New routes:**
```
/admin                         Stats dashboard (total users, active subs, interviews, agent configs)
/admin/users                   Searchable/paginated user table (50/page, query param q)
/admin/users/[userId]          User detail + role picker + suspend/restore/delete
/admin/agents                  Agent config list with type/public/default badges
/admin/agents/new              Create new agent config
/admin/agents/[agentId]/edit   Edit existing agent config

/api/admin/users/[userId]      PATCH (role, isSuspended, isDeleted/deletedAt)
/api/admin/agents              GET / POST
/api/admin/agents/[agentId]    GET / PATCH / DELETE
```

**New components:**
- `components/admin/UserDetailForm.tsx` — client role picker + suspend/delete/restore actions
- `components/admin/AgentConfigForm.tsx` — reusable create/edit form (name, type, systemPrompt, voiceId, elevenLabsAgentId, isPublic, isDefault)
- `components/admin/DeleteAgentButton.tsx` — confirm-dialog delete button

**Phase 7 Status: COMPLETE ✓** — Build passes with exit code 0.

---

### Phase 8: SEO & Content Pages (Complete ✓)

**Goal**: Improve search discoverability and add all missing public-facing content pages.

| ID | Title | Status |
|----|-------|--------|
| ~~deeppivot-111~~ | ~~Content: Legal Pages (ToS, Privacy)~~ | ✓ |
| ~~deeppivot-127~~ | ~~SEO: Generate sitemap.xml~~ | ✓ |
| ~~deeppivot-129~~ | ~~SEO: Add Structured Data (JSON-LD)~~ | ✓ |
| ~~deeppivot-130~~ | ~~Feature: Contact Us Form~~ | ✓ |
| ~~deeppivot-131~~ | ~~Content: FAQ Page~~ | ✓ |
| ~~deeppivot-132~~ | ~~Content: Blog Setup (MDX)~~ | ✓ |

**New routes:**
```
/sitemap.xml                      Dynamic sitemap (MetadataRoute.Sitemap)
/terms                            10-section Terms of Service (static)
/privacy                          8-section Privacy Policy with third-party table (static)
/contact                          Contact form with 3 info cards (static SSR + client form)
/faq                              12 Q&As with Shadcn Accordion (static)
/blog                             MDX blog listing (reads content/blog/*.mdx via gray-matter)
/blog/[slug]                      Individual MDX post (next-mdx-remote/rsc)
/api/contact                      POST handler — validates fields, logs, ready for Resend
```

**New/updated components & files:**
- `app/sitemap.ts` — Next.js sitemap API with all public routes + blog slugs
- `app/(landing)/layout.tsx` — JSON-LD `@graph` (Organization + SoftwareApplication) injected as `<script type=application/ld+json>` on all landing pages; Footer added
- `components/ContactForm.tsx` — client form with success screen
- `components/ui/accordion.tsx` — installed via shadcn CLI
- `components/Footer.tsx` — added `/blog` and `/faq` nav links

**Phase 8 Status: COMPLETE ✓**

---

### Phase 9: UX Polish & Transactional Email (Complete ✓)

**Goal**: Build trust through comprehensive UI loading states, feedback mechanisms, and operational emails.

| ID | Title | Status |
|----|-------|--------|
| ~~deeppivot-113~~ | ~~Backend: Transactional Email Service Setup~~ | ✓ |
| ~~deeppivot-114~~ | ~~Feature: Welcome Email on Signup~~ | ✓ |
| ~~deeppivot-133~~ | ~~UX: Cookie Consent Banner~~ | ✓ |
| ~~deeppivot-135~~ | ~~UX: Loading Skeleton UI~~ | ✓ |
| ~~deeppivot-136~~ | ~~UX: Session Timeout Warning~~ | ✓ |
| ~~deeppivot-138~~ | ~~Feature: Feedback Widget~~ | ✓ |

**Phase 9 Status: COMPLETE ✓**

---

### Phase 10: Performance, Analytics & Polish (Complete ✓)

**Goal**: Optimize bundle sizes, improve database query speed, add feature flagging, and set up core user analytics.

| ID | Title | Status |
|----|-------|--------|
| ~~deeppivot-121~~ | ~~Performance: Bundle Size Optimization~~ | ✓ |
| ~~deeppivot-122~~ | ~~DB: Analyze & Optimize Queries~~ | ✓ |
| ~~deeppivot-124~~ | ~~Scaling: API Prep for Mobile App~~ | ✓ |
| ~~deeppivot-137~~ | ~~Infra: Feature Flag System~~ | ✓ |
| ~~deeppivot-139~~ | ~~Analytics: Track Key User Actions~~ | ✓ |
| ~~deeppivot-140~~ | ~~Analytics: KPI Dashboard Setup~~ | ✓ |
| ~~deeppivot-141~~ | ~~UX: Responsive Polish~~ | ✓ |

**Phase 10 Status: COMPLETE ✓** — `@next/bundle-analyzer` and `posthog-node` configured. Database indexing optimized. Custom feature-flag system implemented. Mobile padding layout fixed.

---

*Last updated: 2026-02-26 — Phase 10 complete. pnpm build exit 0.*
- `content/blog/introducing-deeppivot.mdx` — seed launch announcement post
- Deps added: `gray-matter`, `next-mdx-remote`, `@next/mdx`, `@mdx-js/react`

**Phase 8 Status: COMPLETE ✓** — Build passes with exit code 0 (8 new routes in output).

---

*Last updated: 2026-02-26 — Phase 8 (SEO & Content Pages) complete. deeppivot-111/127/129/130/131/132 shipped. sitemap.xml, JSON-LD structured data, Terms, Privacy, Contact form, FAQ (Shadcn accordion), Blog/MDX listing and detail pages, seed post. pnpm build exit 0.*

---

### Phase 9: UX Polish & Transactional Email (Complete ✓)

**Goal**: Improve UX polish with skeleton screens, session safety, user feedback tooling, GDPR-compliant cookie consent, and a full transactional email pipeline.

| ID | Title | Status |
|----|-------|--------|
| ~~deeppivot-113~~ | ~~Backend: Transactional Email Service Setup~~ | ✓ |
| ~~deeppivot-114~~ | ~~Feature: Welcome Email on Signup~~ | ✓ |
| ~~deeppivot-133~~ | ~~Feature: Cookie Consent Banner~~ | ✓ |
| ~~deeppivot-135~~ | ~~Frontend: Loading Skeleton UI~~ | ✓ |
| ~~deeppivot-136~~ | ~~Security: Session Timeout~~ | ✓ |
| ~~deeppivot-138~~ | ~~Feature: User Feedback Widget~~ | ✓ |

**New/modified files:**
```
src/lib/email.ts                           Resend singleton + sendEmail() helper (RESEND_API_KEY guard)
emails/WelcomeEmail.tsx                    Branded React Email dark theme template
src/inngest/functions/send-welcome-email.ts Inngest function: user/created → welcome email
app/api/inngest/route.ts                   +sendWelcomeEmail registered
app/api/sync-users/route.ts                +inngest.send("user/created") after new user insert
app/api/contact/route.ts                   Upgraded to send HTML email via Resend (with guard)
app/api/feedback/route.ts                  POST: validates 1–5 rating, logs, returns 200
components/CookieConsent.tsx               Banner w/ Accept All / Essential Only + useCookieConsent() hook
components/SessionTimeoutWarning.tsx       25min idle → 5min countdown modal → auto sign-out
components/FeedbackWidget.tsx              Floating side tab → star rating + freetext popover
app/layout.tsx                             +<CookieConsent /> site-wide
app/dashboard/layout.tsx                   +<SessionTimeoutWarning /> +<FeedbackWidget />
app/dashboard/loading.tsx                  Stats row + 6 card skeleton
app/dashboard/job-tracker/loading.tsx      5 Kanban column skeletons
app/dashboard/interviews/loading.tsx       Header + 6 session card skeletons
app/dashboard/career-plan/loading.tsx      Header + progress bar + 5 milestone skeletons
components/ui/skeleton.tsx                 Installed via shadcn CLI
```

**Deps added:** `resend@6.9.2`, `@react-email/components@1.0.8`, `@react-email/render@2.0.4`

> **Note:** Set `RESEND_API_KEY` in production env to activate email sending. All email code gracefully no-ops when key is absent.

**Phase 9 Status: COMPLETE ✓** — Build passes with exit code 0.

---

*Last updated: 2026-02-26 — Phase 9 (UX Polish & Transactional Email) complete. deeppivot-113/114/133/135/136/138 shipped. Resend email pipeline (WelcomeEmail template + Inngest function), cookie consent banner, 4 skeleton loading screens, session timeout modal, feedback widget. pnpm build exit 0.*

---

## Phase 10 — Role-Based Dashboards (Complete ✓)

**Goal:** Create distinct dashboards for Trailblazers (job seekers) and Talent Scouts (employers), update landing page CTAs to route users to the correct dashboard.

| Issue | Description | Status |
|-------|-------------|--------|
| ~~deeppivot-168~~ | ~~UX: Landing Page Feature Refresh~~ | ✓ |
| ~~deeppivot-XXX~~ | ~~UX: Premium Landing Page Refresh & Gamification Showcase~~ | ✓ |
| (inline) | Trailblazer dashboard (`/dashboard/trailblazer`) | ✓ |
| (inline) | Talent Scout dashboard (`/dashboard/talent-scout`) | ✓ |
| (inline) | `src/lib/actions/employer-dashboard.ts` server action | ✓ |

**New routes added:**
```
/dashboard/trailblazer     Job-seeker dashboard (interviews, career plan, archetype, job tracker stats)
/dashboard/talent-scout    Employer dashboard (active jobs, applicants, recent applicant table)
```

**Phase 10 Status: COMPLETE ✓**

---

## Phase 11 — Track-Based Routing & Role-Based UX (Complete ✓)

**Goal:** Every user lands in the right place automatically. New sign-ups choose their track (Trailblazer or Talent Scout) on /onboarding. Returning users are sent directly to their role's dashboard on login. Employer onboarding flow sets the employer role and redirects to /dashboard/talent-scout.

| Issue | Description | Priority |
|-------|-------------|----------|
| ~~deeppivot-169~~ | ~~UX: Post-signup track chooser (Trailblazer vs Talent Scout) on /onboarding~~ | ✓ |
| ~~deeppivot-170~~ | ~~UX: Smart post-login redirect based on stored user role~~ | ✓ |
| ~~deeppivot-171~~ | ~~UX: Employer onboarding completion sets role + redirects to Talent Scout dashboard~~ | ✓ |

**Files to create/modify:**
```
app/onboarding/page.tsx                 New: track chooser with two animated cards
src/lib/actions/onboarding.ts           New: setUserTrack() server action
src/lib/rbac.ts                         Add: getUserDashboardRoute(role) utility
middleware.ts (or proxy.ts)             Modify: afterSignInUrl to use getUserDashboardRoute
app/(auth)/sign-up/*/page.tsx           Modify: afterSignUpUrl -> /onboarding
app/(employer)/employer/onboarding/     Modify: final step calls updateUserRole('employer')
app/(landing)/trailblazer/page.tsx      Modify: 'Go to Dashboard' CTA becomes role-aware
app/(landing)/talent-scout/page.tsx     Modify: 'Go to Dashboard' CTA becomes role-aware
```

---

## Phase 12 — Mentor & WDB Dashboard Activation (Complete ✓)

**Goal:** Replace the placeholder cards on /dashboard/mentor and /dashboard/wdb with real data-driven components, using the already-built backend actions.

| Issue | Description | Priority |
|-------|-------------|----------|
| ~~deeppivot-172~~ | ~~Frontend: Activate Mentor dashboard with real data from mentor-tools.ts~~ | ✓ |
| ~~deeppivot-173~~ | ~~Frontend: Activate WDB partner dashboard with real analytics~~ | ✓ |

**Files to create/modify:**
```
app/dashboard/mentor/page.tsx           Modify: replace 6 placeholders with tabs (Learners | Referrals | Resources)
components/mentor/LearnersTab.tsx       New: connected learners list with session history
components/mentor/ReferralsTab.tsx      New: referral form + history table
components/mentor/ResourcesTab.tsx      New: resource link manager
app/dashboard/wdb/page.tsx             Modify/Verify: confirm WdbChartsClient wired, add roster table + CSV export
components/wdb/LearnerRosterTable.tsx   New: searchable learner table with CSV export
```

---

## Phase 13 — Transactional Email Notifications (Complete ✓)

**Goal:** Extend the Resend email pipeline with 3 new transactional emails triggered by key platform events.

| ID | Title | Status |
|----|-------|--------|
| ~~deeppivot-174~~ | ~~Email: Interview feedback ready notification~~ | ✓ |
| ~~deeppivot-175~~ | ~~Email: New applicant alert for employers~~ | ✓ |
| ~~deeppivot-176~~ | ~~Email: Mentor connection request and acceptance notifications~~ | ✓ |

**Files to create/modify:**
```
emails/InterviewFeedbackReadyEmail.tsx  New: React Email template
emails/NewApplicantEmail.tsx            New: React Email template
emails/MentorConnectionEmail.tsx        New: React Email template (2 variants: request/accepted)
src/lib/email.ts                        Add: 3 new sendXxx() helpers
app/api/jobs/[jobId]/apply/route.ts     Modify: call sendNewApplicantEmail() after application insert
src/lib/actions/mentors.ts             Modify: call sendMentorConnectionEmail() on request/accept
```

**Phase 13 Status: COMPLETE ✓**

---

**Phase 14 Status: COMPLETE ✓**

**Goal:** Publish 3 real SEO-optimized blog posts to drive organic traffic from career changers searching for advice.

| ID | Title | Status |
|----|-------|--------|
| ~~deeppivot-177~~ | ~~Blog: How to Ace a Career Pivot Interview~~ | ✓ |
| ~~deeppivot-178~~ | ~~Blog: What Your Career Archetype Says About You~~ | ✓ |
| ~~deeppivot-179~~ | ~~Blog: 5 Signs You're Ready for a Career Change~~ | ✓ |

**Files to create:**
```
content/blog/how-to-ace-a-career-pivot-interview.mdx     1,200-1,500 words
content/blog/what-your-career-archetype-says-about-you.mdx  1,200-1,500 words
content/blog/5-signs-ready-for-career-change.mdx         1,000-1,200 words
```

**SEO targets:**
- `career pivot interview tips` / `career change interview preparation`
- `career archetype test` / `career personality type`
- `signs you need a career change` / `am I ready for a career change`

---

## Phase 15 — Security & DevOps Polish (Complete ✓)

**Goal:** Close the remaining security gaps and harden the CI/CD pipeline.

| Issue | Description | Priority |
|-------|-------------|----------|
| ~~deeppivot-180~~ | ~~Security: Extend Upstash rate limiting to all unprotected API routes~~ | ✓ |
| ~~deeppivot-181~~ | ~~Security: PII anonymization in interview transcript storage~~ | ✓ |
| ~~deeppivot-182~~ | ~~DevOps: CI/CD hardening — migration check, Playwright artifacts, npm caching~~ | ✓ |

**Files to modify:**
```
app/api/contact/route.ts               Add: rateLimit('AUTH')
app/api/feedback/route.ts              Add: rateLimit('DEFAULT')
app/api/jobs/[jobId]/apply/route.ts    Add: rateLimit('INTERVIEW_START')
app/api/companies/route.ts             Add: rateLimit('DEFAULT')
app/api/admin/*/route.ts               Add: rateLimit('ADMIN')
src/inngest/functions/*.ts             Add: anonymize() calls before transcript/feedback DB writes
scripts/test-pii.ts                    New: PII anonymization unit test
app/(landing)/privacy/page.tsx         Add: GDPR note on transcript anonymization
.github/workflows/ci.yml               Add: migration check, Playwright artifact upload, npm cache
CONTRIBUTING.md                        New: branch protection, CI requirements, migration policy
```

*Last updated: 2026-02-27 — Phase 11-15 complete. All 14 issues (deeppivot-169 to deeppivot-182) implemented. Track-based routing, mentor/WDB dashboard activation, and DevOps/Security hardening are live.*

---

## Phase 16 — Advanced User Value & Scalability (In Progress)

**Goal:** Deliver 5 major capability upgrades to enhance deep personalization, engagement, and actionable job placement for learners. 140 new issues (deeppivot-183 to deeppivot-322) have been generated to cover these features.

### 1. Context-Aware "Job Specific" Practice Interviews
- [x] Database Schema: `job_descriptions` table (UUID/int id, string title, text company, text content). (Phase 16 starts here)
- [x] Allow users to paste raw Job Description text.
- [x] API routes for managing job descriptions (`POST`, `GET`, `PATCH`, `DELETE`).
- [x] Extracted raw text endpoint for PDF attachments.
- [x] UI: Job Description Library page.
- [x] UI: View/Edit parsed job description details.
- [x] LLM: Prompt template for generic job parsing.
- [x] LLM: Extract core requirements from JD (Skills, Experience).
- [x] System: Matching user resume gap analysis vs JD.
- [x] LLM: Generate context-aware ElevenLabs system prompt.
- [x] System: Inject JD context into AI interviewer persona.
- [x] Integration: Send dynamic system prompt to ElevenLabs WebSocket.
- [x] LLM: Generate behavioral questions based on JD culture.
- [x] UI: Interview settings modal: select resume & target JD.
- [x] UI: Job match score visualization on session complete.
- [x] UI: "Practice for this Job" button on job tracker cards.
- [x] UI: Real-time JD reference panel during interview.
- [x] UI: Post-interview feedback shows gap analysis vs JD.
- [x] API: Store extracted JD embeddings for fast retrieval.
- [x] QA: End-to-end testing of Context-Aware interview.

### 2. Resume Parsing & Cover Letter Generation
- [x] Automating the extraction of user information from uploaded resumes. (DB Schema: user_resumes)
- [x] DB Schema: `parsed_resume_data` JSONB structure (deeppivot-212) — ResumeExtraction type, user_resumes.parsedData
- [x] UI: Resume management dashboard (deeppivot-217) — /dashboard/practice/resumes, AddResumeModal, PATCH/DELETE APIs
- [x] UI: Resume upload drag-and-drop zone (deeppivot-218) — AddResumeModal Upload tab
- [x] UI: Parsed resume data verification form (deeppivot-219) — ParsedResumeVerificationModal, Verify data in card menu
- [x] UI: Cover letter preview modal in job Kanban board (deeppivot-237) — CoverLetterPreviewModal, View Cover Letter in card menu
- [x] Integration: Link cover letters to Job Tracker (deeppivot-235) — coverLetterId + jobDescriptionId on job_applications, Link UI, Add from JD library
- [x] UI: Real-time streaming response for cover letter generation (deeppivot-224) — streamCoverLetter() via OpenAI streaming API, POST /api/cover-letters/generate/stream route with ReadableStream + DB persist on completion, GenerateCoverLetterModal with JD/resume/tone selectors + live cursor animation, "Generate with AI" button in CoverLetterPreviewModal
- [x] System: Rate limit cover letter generation (deeppivot-230) — COVER_LETTER_GENERATE profile (10 req/min) in rate-limit.ts, wired into both generate and stream routes
- [x] UI: Tone selection dropdown in CL generator (deeppivot-233) — implemented as part of deeppivot-224 GenerateCoverLetterModal (professional/conversational/enthusiastic)
- [x] Generating and refining personalized cover letters based on target job descriptions and matching experience. (deeppivot-223, deeppivot-225) — /dashboard/cover-letters dashboard page, CoverLetterGenerator with streaming, CoverLetterEditor with Markdown preview & persistent storage.

### 3. In-App Notification Center & Admin Announcements
- Real-time notification system (WebSockets/SSE) for key platform events (e.g., feedback ready, mentor connection).
- Admin broadcast tools for sending system announcements and redirecting users.
- [x] DB Schema: `notifications` table (deeppivot-239) — id, userId, title, body, isRead, type, link + indexes on userId, isRead, type. Migration 0028.
- [x] DB Schema: `admin_announcements` table (deeppivot-240) — id, title, body, createdBy, createdAt. Migration 0029.
- [x] API: GET /api/notifications (Paginated) (deeppivot-241) — ?page=&limit=, auth, order by createdAt desc
- [x] API: PATCH /api/notifications/[id]/read (deeppivot-242) — mark notification as read, auth + ownership
- [x] API: PATCH /api/notifications/read-all (deeppivot-243) — mark all as read for current user
- [x] System: Real-time notification layer via SSE (deeppivot-244) — GET /api/notifications/stream, useNotificationStream hook
- [x] UI: Toast notifications sync with Notification Center (deeppivot-265) — NotificationToastSync component in DashboardLayout, listens to SSE stream and displays react-hot-toast.
- [x] UI: Notification Bell icon in DashboardTopBar (deeppivot-245) — Bell + unread badge in NotificationDropdown
- [x] UI: Notification unread count badge (deeppivot-246) — Dedicated GET /api/notifications/unread-count endpoint for accurate badge count on mount; badge now has ring-2 ring-background polish; pill badge inside dropdown header showing live unread count
- [x] UI: Notification dropdown popover (deeppivot-247) — NotificationDropdown in DashboardTopBar
- [x] UI: Notification Empty state and loading skeletons (deeppivot-248) — 4-row Skeleton loading state in dropdown; BellOff icon empty state with 'You're all caught up' heading; Next.js loading.tsx with 6-card skeleton layout for /dashboard/notifications page
- [x] UI: "View All Notifications" full page (deeppivot-249) — Enhanced /dashboard/notifications: type icons (Mic2/Users/Megaphone/FileText) with colored icon containers for unread items, type pill badge, relative timestamps, "Mark all as read" button (CheckCheck), unread indicator dot, border-primary/20 highlight; "View all notifications" footer link in dropdown; loading.tsx skeleton screen
- [x] Event trigger: Mentor connection accepted → in-app notification (deeppivot-250) — createNotification, updateConnectionStatus
- [x] Event trigger: Interview feedback ready → in-app notification (deeppivot-251) — createNotification in processInterviewFeedback Inngest step
- [x] Event trigger: Job application status update → in-app notification (deeppivot-252) — createNotification in PATCH /api/employer/applications/[appId]
- [x] Admin: /admin/announcements listing page (deeppivot-253) — listing + new form, POST broadcasts to users.
- [x] Integration: Send announcement digest via Resend (deeppivot-260) — Premium `AnnouncementEmail` React-Email template; batch sending support in `src/lib/email.ts`; integrated into Inngest broadcast worker for efficiency.
- [x] Admin Settings: System settings UI manager (`/admin/settings`) (deeppivot-261) — Premium tabbed interface; toggles for boolean settings; masked env var viewer; audit logs.
- [x] DB Schema: `system_settings` key-value store (deeppivot-262) — Defined `system_settings` table in `schema.ts` with key/value/type/audit fields.
- [x] Admin API: Manage environment variables / system toggles dynamically (deeppivot-263) — Server actions for CRUD on settings with automatic revalidation and RBAC.
- [x] Admin UI: Rich text editor for announcements (deeppivot-254) — Custom `RichTextEditor` component using `contentEditable`, toolbar for bold/italic/lists/headings, HTML rendering in `AnnouncementView`.
- [x] UI: Dedicated `/announcements/[id]` reading page (deeppivot-259) — Premium article-style view with automatic dismissal on mount; metadata display (date, author); back-to-dashboard navigation; universal back-linking from notifications.
- [x] UI: System Announcement banner (dismissible) (deeppivot-258) — Dismissible glassmorphism banner in dashboard layout; `AnnouncementBanner` component + `getLatestAnnouncement` server action.
- [x] Admin API: Broadcast announcement to all users (fan-out worker) (deeppivot-256) — Inngest `broadcastAnnouncement` function with chunked background delivery.
- [x] Admin API: Send to Home (deeppivot-257) — sendToHome on announcement, force redirect to /dashboard/announcements/[id] until dismissed.

- [x] Gamification: points and weekly streaks logic (deeppivot-267-270)
- [x] UI: Leaderboard page (Opt-in only) (deeppivot-283) — Implemented /dashboard/leaderboard with privacy opt-in, podium, and rankings.
- [x] API: GET `/api/leaderboard` (Top 50 users) (deeppivot-284) — Secure endpoint for public leaderboard data.
- [x] E2E: Leaderboard verification (deeppivot-leaderboard-e2e) — Playwright tests for accessibility, privacy, and API.
- [x] UI: Weekly streak flame icon and count (deeppivot-275)
- [x] Gamification: Hub panel on dashboard (deeppivot-274)
- [x] Badge System: Evaluate badge unlocking rules async (deeppivot-281)
- [x] UI: Achievement Badge display in Gamification Hub (deeppivot-282) — /dashboard/achievements page with stats row (points, level, streak, badges), level progress bar, AchievementsBadgeGrid (unlocked/locked with category colors, framer-motion animations); Achievements nav link in DashboardSidebar; GamificationHub "All Badges" links to /dashboard/achievements
- [x] UI: Share achievement to LinkedIn (deeppivot-285) — ShareToLinkedInButton on /dashboard/achievements, opens LinkedIn share dialog with achievements URL
- [x] Feedback: Show points earned in interview feedback summary (deeppivot-286) — getPointsEarnedForInterviewSession(), +N pts badge on feedback page
- [ ] UI: "Badge Unlocked" celebration modal (deeppivot-283)
- [x] DB: `user_gamification` table (points, currentStreak, highestStreak) — migration 0025
- [x] Hook: Add points on job application submitted (10 pts via `addPointsForJobApplication` in POST /api/jobs/[jobId]/apply)
- [x] Design: 10 badge icons SVG (deeppivot-279) — public/badges/*.svg + gamification-badges.ts
- [x] QA: Gamification engine edge cases and timezone testing (deeppivot-294) — vitest unit tests + e2e/gamification.spec.ts
- [x] Admin: Manual override/grant points tool (deeppivot-293) — POST /api/admin/users/[userId]/gamification, UserDetailForm
- [x] DB Schema: `user_badges` link table (deeppivot-280) — userBadgesTable (id, userId FK cascade, badgeId varchar(64), unlockedAt, unique(userId,badgeId), index on userId) + relations + migration 0032
- [x] DB Schema: `gamification_events` audit log (deeppivot-268) — gamificationEventsTable (id, userId FK cascade, eventType varchar(64), points, metadata JSONB, createdAt) + 3 indexes (userId, eventType, createdAt) + logGamificationEvent() + addPoints() now logs to audit table. Migration 0033
- [x] Hook: Add points on interview completion (deeppivot-271) — addPointsForInterviewCompletion() (15 pts) wired into endInterviewSession() after status→"completed", with sessionId/sessionType/overallScore metadata in audit log
- [x] Hook: Add points on career plan milestone completion (deeppivot-272) — addPointsForMilestoneCompletion() (5 pts) wired into PATCH /api/plans/[id] and updateMilestone() server action on status→"completed" transition, with milestoneId/title metadata in audit log
- [x] API: GET `/api/gamification/status` (deeppivot-269) — returns authenticated user's points, streaks, unlocked badges (with label/icon metadata from gamification-badges.ts), and last 10 gamification events. Rate-limited via DEFAULT profile.
- [x] UI: Points animation (floating +10) on successful actions (deeppivot-276) — Zustand gamification store (src/store/gamification.ts), PointsAnimation Framer Motion component (amber gradient bubble, Sparkles icon, 2.4s auto-dismiss), wired into ApplyModal (+10), ElevenLabsInterviewRoom (+15), MilestoneTimeline (+5). API responses include pointsAwarded field.
- [x] Cron: Reset streaks if no weekly activity (deeppivot-270)
- [x] UI: Confetti effect on reaching streak milestones (deeppivot-277) — canvas-confetti multi-burst celebration (center + left/right) at 4/8/12/26/52-week milestones; StreakConfetti component with localStorage dedup; integrated into StreakBadge.
- [x] UI: Leveling system UI (deeppivot-278) — 10 levels (Newcomer→Apex, 0→3500 pts) with animated progress bar in GamificationHub; level info added to /api/gamification/status response; src/lib/gamification-levels.ts utility.
- [x] Security: Prevent gamification endpoint abuse/spamming (deeppivot-292) — GAMIFICATION_ACTION rate limit profile (10 req/5min per user); deduplication keys in addPoints() prevent milestone toggle and session re-completion exploits; per-user rateLimitByUser on job apply and milestone PATCH; active-status guard on interview completion
- [x] UI: "Hours Practiced" statistic on dashboard (deeppivot-289) — SQL SUM of interview session durations (endedAt - startedAt) in getDashboardSummary(); Clock icon stat in InterviewSummaryWidget with hours/minutes display
- [x] System: Practice time tracking aggregation (minutes spent in interview) (deeppivot-288) — Added shared `getPracticeTimeAggregation(userId)` utility to aggregate completed interview durations into `totalMinutes` and `thisWeekMinutes`; wired into `/api/gamification/status` and `getGamificationStatus()` server action.
- [x] User Setting: Toggle to disable gamification features (deeppivot-291) — Added profile setting backed by `system_settings` (`gamification:user:<id>:enabled`), enforced in points award pipeline (`addPoints` short-circuit), exposed via gamification status API/action, and reflected in Profile Settings + Achievements/Gamification hub behavior.
- [x] Admin: Reporting on gamification engagement metrics (deeppivot-290) — Added admin analytics module (`getAdminGamificationMetrics`) and `/admin/gamification` dashboard with enabled/disabled adoption, 7-day activity/points, streak participation, top event types, and top users by points.
- [x] Notifications: Push notification when streak is about to expire (deeppivot-287) — Added daily Inngest cron (`gamification-streak-expiry-notifications`) that detects at-risk weekly streaks, skips users with gamification disabled, dedupes reminders to once per week, and creates in-app notifications linking to interview practice.
- [ ] UI: Gamification Hub, streak flame, confetti, badges

### 5. Employer / Candidate Matching Engine & Advanced Data Exports
- [x] Admin: Advanced Data Export (CSV) for users table — 28 columns, gamification + WDB fields, ?role= & ?includeDeleted= filters
- [x] Admin API: Generate signed CSV download link (deeppivot-313) — POST /api/admin/export/users/link, GET /api/admin/export/download?token= (15min expiry)
- [x] Feedback algorithm: Improve matching weights based on outcome — matching_feedback + matching_weights tables, recordMatchingFeedback on hired/rejected, aggregateMatchingFeedback (Inngest cron daily)
- [x] Privacy UI: "Open to Opportunities" toggle (deeppivot-319) — users.openToOpportunities, profile settings card
- [x] Privacy: Ensure matched candidates opt-in to employer discovery (deeppivot-318) — getTopCandidateMatches strictly filters by openToOpportunities=true
- [x] System: Exclude opted-out users from Employer matching pool (deeppivot-320) — matching engine checks privacy flags
- [x] DB Schema: `job_matches` table (deeppivot-295) — Added `job_matches` with unique (jobId,userId), `matchScore`, `status`, and timestamps; wired Drizzle relations to `jobs` and `users`; migration `0034_sturdy_cypher.sql` added.
- [x] AI/ML: Define matching algorithm weights (Skills, Archetype, Salary) (deeppivot-296) — Added explicit default weights (`skills_match`, `archetype_match`, `salary_match`, `interview_score`) and applied a normalized weighted scoring model in employer candidate matching API, including salary compatibility from job salary range and resume years-of-experience heuristics.
- [x] AI/ML: Embed user profiles/resumes natively (deeppivot-297) — Added `user_resumes.embedding_vector` (JSONB) plus migration `0035_sharp_mimic`; resume upload/patch flows now generate and persist native embeddings from structured profile+raw resume text for matching/search.
- [x] AI/ML: Embed marketplace job descriptions (deeppivot-298) — Added `jobs.embedding_vector` (JSONB) with migration `0036_mighty_nomad`; marketplace job create/update APIs now generate and persist semantic embeddings from job metadata + description.
- [x] System: Cron job to calculate nightly matches for new jobs (deeppivot-299) — Added Inngest cron `nightly-job-matches` to compute embedding similarity for newly published jobs, then upsert top candidate rows into `job_matches` nightly.
- [x] API: GET `/api/jobs/matches` (deeppivot-300) — Added candidate-side recommendations endpoint backed by `job_matches`, with auth, score/status filtering, pagination, and automatic `suggested` → `viewed` transition for surfaced matches.
- [x] API: GET `/api/employer/jobs/[jobId]/matches` (deeppivot-301) — employer/admin-protected endpoint with per-job candidate matching scores, applied/invited candidate exclusion, and weighted scoring from resume skills + interview performance + archetype signal.
- [x] Candidate UI: "Recommended Jobs" section on dashboard (deeppivot-302) — Added recommended job cards to Trailblazer dashboard powered by precomputed `job_matches` via server action (`getRecommendedJobsForCandidate`), including match score, company, location/remote, salary hints, and `/jobs/[jobId]` deep-links.
- [x] Candidate UI: Match percentage indicator on job cards (deeppivot-303) — Updated marketplace listing cards to show per-user match percentage badges by left-joining `job_matches` for the authenticated candidate on `/jobs`.
- [x] Candidate UI: "Why you match" explanation tooltip (LLM) (deeppivot-304) — Added lazy-loaded tooltip explanations on candidate job cards via new authenticated endpoint `/api/jobs/matches/explain`, backed by LLM-generated fit summaries with deterministic fallback signals.
- [x] Employer UI: "Top Candidate Matches" tab in job management (deeppivot-305) — Extended employer job-management screen with a dedicated matches tab, candidate match-score detail panel, and direct "Invite to Apply" action wired to employer invite API.
- [x] Employer UI: Anonymized candidate summary for unbiased sourcing (deeppivot-306) — Added bias-safe blind mode in employer match review with anonymized labels and signal-based summaries (experience/interview/archetype/skills) while hiding identity by default.
- [x] System: "Invite to Apply" button for Employers (deeppivot-307) — Completed employer invite flow end-to-end: Top Candidate Matches includes invite action, backend persists invitation + sends notification email, and match lifecycle now transitions to `job_matches.status = invited`.
- [x] Email: Weekly digest of top job matches for candidate (deeppivot-309) — Added weekly Inngest digest cron for opted-in candidates with top non-applied published matches and new email template delivery via Resend.
- [x] Email: Weekly digest of top candidates for active employer jobs (deeppivot-310) — Added weekly employer digest cron and email template summarizing top candidate matches across active published jobs with archetype/interview signals.
- [ ] Semantic matching algorithm comparing candidate embeddings (resume/archetype) with job descriptions.
- [x] Employer dashboard "Top Candidate Matches" and user dashboard "Recommended Jobs".
- [ ] Admin data exports to CSV for offline analysis.

---

*Last updated: 2026-02-28 — deeppivot-286 (Points earned in interview feedback) closed. getPointsEarnedForInterviewSession() + badge on feedback page. Phase 16.4 Gamification progressing.*
*Last updated: 2026-03-03 — deeppivot-288 closed. Added centralized practice-time aggregation from completed interview durations (total + last 7 days), surfaced via gamification status API/server action.*
*Last updated: 2026-03-03 — deeppivot-301 closed. Added `GET /api/employer/jobs/[jobId]/matches` with employer ownership checks, candidate privacy filtering, applied/invited exclusion, and deterministic weighted matching scores.*
*Last updated: 2026-03-03 — deeppivot-291 closed. Added user-level gamification toggle in profile settings, persisted via `system_settings`, enforced in points awarding, and surfaced in status payloads/UI.*
*Last updated: 2026-03-03 — deeppivot-290 closed. Added admin gamification reporting with `/admin/gamification`, including adoption, 7-day engagement, points throughput, streak participation, event distribution, and top-user leaderboard metrics.*
*Last updated: 2026-03-03 — deeppivot-287 closed. Added streak-expiry reminder notifications via daily Inngest cron, weekly dedupe guard, and disabled-user filtering.*
*Last updated: 2026-03-03 — deeppivot-295 closed. Added `job_matches` schema + migration with per job/user uniqueness, indexed score lookups, and typed relations for matching APIs/cron.*
*Last updated: 2026-03-03 — deeppivot-296 closed. Added explicit weighted scoring dimensions for skills/archetype/salary/interview and wired them into `/api/employer/jobs/[jobId]/matches`.*
*Last updated: 2026-03-03 — deeppivot-297 closed. Added native resume/profile embeddings (`user_resumes.embedding_vector`) with automatic generation on upload and parsed-data updates.*
*Last updated: 2026-03-04 — deeppivot-298 closed. Added native marketplace job embeddings (`jobs.embedding_vector`) and automatic embedding generation on job create/update.*
*Last updated: 2026-03-04 — deeppivot-299 closed. Added nightly Inngest match-calculation cron that computes embedding-based scores for new jobs and upserts `job_matches` suggestions.*
*Last updated: 2026-03-04 — deeppivot-300 closed. Added candidate recommendations API `/api/jobs/matches` with filtering, pagination, and viewed-state progression for suggested matches.*
*Last updated: 2026-03-04 — deeppivot-302 closed. Added "Recommended Jobs" panel on Trailblazer dashboard using `job_matches` with match badges and job detail links.*
*Last updated: 2026-03-04 — deeppivot-303 closed. Added match percentage badges on `/jobs` listing cards for authenticated candidates using `job_matches` joins.*
*Last updated: 2026-03-04 — deeppivot-304 closed. Added LLM-backed "Why you match" tooltip explanations on candidate job cards (marketplace and dashboard) with authenticated match-scoped API and fallback reasoning.*
*Last updated: 2026-03-04 — deeppivot-305 closed. Added employer-side "Top Candidate Matches" tab in job management with match breakdown and inline invite-to-apply workflow.*
*Last updated: 2026-03-04 — deeppivot-306 closed. Added anonymized candidate summaries and blind-mode identity masking for unbiased employer sourcing in Top Candidate Matches.*
*Last updated: 2026-03-04 — deeppivot-307 closed. Completed employer "Invite to Apply" workflow and added match-status transition to `invited` when invitations are sent.*
*Last updated: 2026-03-04 — deeppivot-309 closed. Added weekly candidate top-match digest emails via new Inngest cron, email template, and send helper integration.*
*Last updated: 2026-03-04 — deeppivot-310 closed. Added weekly employer top-candidates digest emails for active jobs via new Inngest cron, email template, and send helper integration.*
