# DeepPivot

> AI-powered career development platform — voice interviews, emotional intelligence feedback, career archetypes, and workforce development tools.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSpirovanni%2Fdeeppivot)

---

## Features

| Feature | Status |
|---------|--------|
| **AI Voice Interviews** — Hume EVI, emotion detection, <800ms latency | ✅ Live |
| **Emotional Intelligence Feedback** — Per-session emotion timeline & insights | ✅ Live |
| **Performance Analytics** — Sessions over time, score trend, emotion pie, skills radar | ✅ Live |
| **Career Archetype Assessment** — 18-question Likert assessment, 6 archetypes, trait radar | ✅ Live |
| **Career Planning** — Draggable milestone timeline, linked resources | ✅ Live |
| **Mentor Network** — Searchable directory, connection requests | ✅ Live |
| **Education Explorer** — 28 programmes (bootcamps, certs, degrees) + 9 funding sources | ✅ Live |
| **Job Tracker** — Kanban board, dnd-kit drag & drop, optimistic UI | ✅ Live |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2 (App Router) |
| Database | PostgreSQL on Neon |
| ORM | Drizzle ORM 0.44 |
| Auth | Clerk (webhook + client sync) |
| AI Voice | Hume EVI (`@humeai/voice-react`) |
| Charts | Recharts 3 |
| Drag & Drop | dnd-kit |
| UI | Shadcn UI + Radix + Tailwind CSS 4 |
| Hosting | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A [Neon](https://neon.tech) PostgreSQL database
- A [Clerk](https://clerk.com) application
- A [Hume AI](https://hume.ai) API key

### 1. Clone & Install

```bash
git clone https://github.com/Spirovanni/deeppivot.git
cd deeppivot
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Database
DATABASE_URL=postgresql://...

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
CLERK_WEBHOOK_SECRET=whsec_...

# Hume AI
HUME_API_KEY=...
HUME_SECRET_KEY=...
NEXT_PUBLIC_HUME_CONFIG_ID=...

# Vapi Voice AI (Phase 3 — optional until AI interview pipeline is complete)
VAPI_API_KEY=...
VAPI_INTERVIEW_ASSISTANT_ID=...  # Default assistant for interview sessions
VAPI_PHONE_NUMBER_ID=...         # Optional — required for outbound phone calls only

# Deepgram STT (Phase 3 — optional until transcription pipeline is active)
DEEPGRAM_API_KEY=...             # Deepgram API key (console.deepgram.com)
```

### 3. Database Setup

```bash
# Generate and apply all migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Seed data (mentors, education programmes, funding) is applied automatically on first page load.

### 4. Run Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
├── app/
│   ├── (auth)/                    # Clerk sign-in/sign-up
│   ├── (landing)/                 # Marketing landing page
│   ├── api/                       # Route handlers (Hume token, Clerk webhook)
│   └── dashboard/
│       ├── analytics/             # LP5: Performance Analytics
│       ├── archetype/             # LP6: Career Archetype Assessment
│       ├── career-plan/           # LP7: Career Planning & Roadmap
│       ├── education/             # LP9: Education Explorer
│       ├── interviews/            # LP3+LP4: AI Voice Interviews & History
│       ├── job-tracker/           # Job Application Kanban
│       └── mentors/               # LP8: Mentor Network
├── components/
│   ├── analytics/                 # Recharts chart components
│   ├── archetype/                 # AssessmentForm, ArchetypeResult, TraitRadar
│   ├── career-plan/               # MilestoneTimeline, dialogs
│   ├── dashboard/                 # DashboardSidebar
│   ├── education/                 # ProgramCard, FundingCard, EducationExplorer
│   ├── interviews/                # EmotionTimeline, CommunicationSummary
│   ├── job-tracker/               # KanbanBoard, SortableJobCard, dialogs
│   ├── mentors/                   # MentorCard, MentorGrid
│   └── ui/                        # Shadcn UI primitives
├── drizzle/                       # SQL migration files
├── src/
│   ├── db/
│   │   └── schema.ts              # All Drizzle table + relation definitions
│   └── lib/
│       ├── actions/               # Server actions (per feature)
│       └── archetypes.ts          # Archetype definitions + scoring algorithm
└── utils/                         # Helpers (cn, expressionColors, etc.)
```

---

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | Full user profile, Clerk sync, credits |
| `job_boards` / `job_columns` / `job_applications` | Kanban job tracker |
| `interview_sessions` / `interview_questions` / `emotion_snapshots` | AI interview pipeline |
| `career_archetypes` | Per-user archetype assessment results |
| `career_milestones` / `career_resources` | Career planning roadmap |
| `mentors` / `mentor_connections` | Mentor directory + connection requests |
| `education_programs` / `funding_opportunities` | Education programme catalogue |

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — protected, requires PR review |
| `develop` | Integration branch — merge feature branches here first |
| `feat/*` | Feature branches (e.g. `feat/lp10-ai-scoring`) |
| `fix/*` | Bug fix branches |

---

## Contributing

1. Branch from `develop`: `git checkout -b feat/your-feature develop`
2. Open a PR targeting `develop`
3. After review and merge to `develop`, a separate PR promotes `develop → main`

---

## License

MIT © 2026 DeepPivot / Spirovanni
