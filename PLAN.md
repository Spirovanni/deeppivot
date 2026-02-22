# DeepPivot Development Plan

> **Planning started**: 2026-02-22  
> **Issues**: 142 total in `.beads/issues.jsonl` | **Dependencies**: 166 configured  
> **Task tracking**: `bd ready` | `bd list` | `bd show <id>`

---

## Current State

### ✅ Completed (JT1–JT8)
- **Job Tracker**: Prisma/Drizzle schema, auth hooks, Epicflow node config, execution engine, Kanban UI, server actions, dnd-kit, E2E testing
- **Stack**: Next.js, Drizzle ORM, Neon Postgres, Clerk, Shadcn UI

### 🔓 Ready to Start (2 issues)
| ID | Title |
|----|-------|
| **deeppivot-9** | LP1: Dashboard Shell & Sidebar Navigation |
| **deeppivot-18** | Project: Initialize GitHub Repository |

> **Note**: deeppivot-18 may be done if repo/branch protection already exists. Run `bd show deeppivot-18` to confirm.

---

## Phased Roadmap

### Phase 1: Foundation & Dashboard (Immediate)
**Goal**: Shared dashboard shell so all features have a home.

| Order | Issue | Title |
|-------|-------|-------|
| 1 | deeppivot-9 | LP1: Dashboard Shell & Sidebar Navigation |
| 2 | deeppivot-10 | LP2: Interview Session Database Models & Migration |
| 3 | deeppivot-14 | LP6: Career Archetype Assessment |
| 4 | deeppivot-15 | LP7: Personalized Career Planning & Roadmap |
| 5 | deeppivot-16 | LP8: Mentor & Coach Network |
| 6 | deeppivot-17 | LP9: Alternative Education Explorer |

**Unblocks**: LP3–LP5 (interview flow), plus all dashboard-dependent features.

---

### Phase 2: AI Voice Interview Pipeline
**Goal**: End-to-end interview practice with Hume AI.

| Order | Issue | Title |
|-------|-------|-------|
| 1 | deeppivot-10 | LP2: Interview Session DB (from Phase 1) |
| 2 | deeppivot-11 | LP3: AI Voice Interview Session Page |
| 3 | deeppivot-12 | LP4: Interview History & Emotion Feedback Reports |
| 4 | deeppivot-13 | LP5: Real-time Performance Analytics Dashboard |

**Prerequisites**: LP1 (dashboard), LP2 (DB schema).

---

### Phase 3: Infrastructure & Auth (Parallel Track)
**Goal**: Production-ready infra, auth, and billing.

| Order | Issue | Title |
|-------|-------|-------|
| 1 | deeppivot-18 | Project: Initialize GitHub Repository |
| 2 | deeppivot-19 | Frontend: Initialize Next.js 15 Project |
| 3 | deeppivot-21 | Backend: Provision Neon Postgres Database |
| 4 | deeppivot-22 | Backend: Configure Drizzle ORM |
| 5 | deeppivot-20 | Frontend: Integrate Shadcn UI |
| 6 | deeppivot-24 | Backend: Set up Supabase for Storage & Real-time |
| 7 | deeppivot-25 | Auth: Implement User Authentication (Clerk) |
| 8 | deeppivot-28 | Frontend: Build Auth Forms (Login/Register) |
| 9 | deeppivot-29 | Auth: Implement Role-Based Access Control (RBAC) |

**Note**: Many of these may already be done (e.g. Neon, Drizzle, Shadcn, Clerk). Use `bd show <id>` to verify.

---

### Phase 4: Voice & AI Services
**Goal**: Vapi, Deepgram, Hume, TTS, LLM orchestration.

| Order | Issue | Title |
|-------|-------|-------|
| 1 | deeppivot-35 | Backend: Vapi Integration Service |
| 2 | deeppivot-36 | Backend: Deepgram Integration Service |
| 3 | deeppivot-37 | Backend: Hume.ai Integration Service |
| 4 | deeppivot-38 | Backend: TTS Integration Service (ElevenLabs/PlayHT) |
| 5 | deeppivot-39 | Backend: LLM Orchestration Service (GPT-4/Claude-3) |
| 6 | deeppivot-40 | Backend: Core Interview Session Handler |

---

### Phase 5: Post-Interview & Career Archetyping
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

### Phase 6: DevOps, Security & Polish
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

## Quick Commands

```bash
# Find next work
bd ready

# Inspect an issue
bd show deeppivot-9

# Start work
bd update deeppivot-9 --status in_progress

# Complete work
bd close deeppivot-9

# See blocked issues
bd blocked

# Sync at session end
bd sync
```

---

## Dependency Graph Summary

- **LP chain**: LP1 → LP2 → LP3 → LP4 → LP5
- **LP1 (dashboard)** unblocks: LP2, LP6, LP7, LP8, LP9
- **Task Master infra** (deeppivot-18–19) unblocks most backend/frontend tasks
- **Interview pipeline** depends on: DB schema (LP2), Vapi (35), Hume (37), TTS (38), LLM (39)

---

*Last updated: 2026-02-22*
