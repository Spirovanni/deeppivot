# PRD — DeepPivot Career Platform (with Integrated Job Marketplace)

**Version:** 1.0  
**Last Updated:** February 24, 2026  
**Owners:** Product / Engineering  

---

## 1. Product Overview

DeepPivot is a career development platform that helps users practice interviews with AI voice, track job applications, discover career archetypes, build career roadmaps, connect with mentors, and explore alternative education programs.

The platform will now **promote the existing “Job Tracker” into a full Job Marketplace**, integrating the functionality described in the **Indeed Clone PRD** (job board, employer tools, admin moderation) while preserving DeepPivot as the central experience and brand.  

---

## 2. Problem Statement

### 2.1 DeepPivot Core Problems

DeepPivot currently focuses on interview practice, emotional intelligence feedback, career archetyping, roadmapping, mentor matching, and education exploration.  

However, users must still go elsewhere (Indeed, LinkedIn, other job boards) to find and apply to jobs, breaking the flow between practice, planning, and real applications.  

### 2.2 Job Marketplace Problems

The existing Job Tracker provides kanban‑style tracking for external job applications but does not host jobs itself or offer employer‑facing tools.  

The Indeed Clone project describes a full job marketplace where jobs are posted, discovered, and applied to on‑platform, but is currently specified as a standalone app.  

**Opportunity:** Combine DeepPivot’s rich coaching and planning tools with a native job marketplace so users can discover roles, apply, and receive feedback in one integrated environment.

---

## 3. Product Vision & Goals

### 3.1 Vision

DeepPivot becomes a **full‑funnel career operating system**:

- Discover careers and education paths.  
- Practice interviews and build skills with AI voice.  
- Discover jobs on a built‑in marketplace (Indeed‑style).  
- Apply, track, and optimize job search over time.  

### 3.2 Goals

**G1 — Single Career Hub:** Users can handle **discovery → preparation → application → reflection** entirely within DeepPivot.  

**G2 — Integrated Job Marketplace:** Add a multi‑role job platform (job seeker, employer, admin) that closely follows the Indeed Clone PRD but uses DeepPivot’s existing stack (Next.js, Neon Postgres, Drizzle, Clerk).  

**G3 — Leverage Existing Job Tracker:** Extend the current `job_applications` system so applications from the new marketplace appear in the same kanban tracker, instead of duplicating functionality.  

**G4 — AI‑Enhanced Job Search:** Use DeepPivot’s behavioral data (archetypes, interview performance, career plans) to improve job recommendations and guidance over time (post‑MVP).  

---

## 4. Scope

### 4.1 In Scope (This PRD)

1. **Core DeepPivot Platform (existing, central)**  
   - Dashboard shell, auth, database, voice interview pipeline, archetyping, career plans, mentors, and education explorer remain the **central product** as described in ROADMAP.md.  

2. **Integrated Job Marketplace (new, from Indeed PRD)**  
   - Job seeker experience: search, job listing, job details, profile, applications.  
   - Employer experience: company profile, job posting, application review.  
   - Admin tools: moderation of jobs, employers, and problematic content.  
   - Search and filtering: keyword, location, job type, experience level, remote/on‑site.  

3. **Unification with Existing Job Tracker**  
   - Connect new on‑platform applications to `job_applications` and job boards so users see marketplace and external jobs in a single tracker.  

### 4.2 Out of Scope (for this iteration)

- Payments and billing for sponsored jobs or employer subscriptions (future).  
- Real‑time chat between employers and candidates.  
- Advanced recommendation engine using ML (beyond basic similar‑jobs; future).  

---

## 5. Users and Ecosystem

### 5.1 User Types

- **Learner / Job Seeker (DeepPivot primary user)**  
  - Practices interviews via AI voice sessions.  
  - Receives emotional and performance feedback.  
  - Builds career roadmaps and explores education options.  
  - **New:** Browses and applies to jobs on DeepPivot’s job marketplace and tracks applications in the existing Job Tracker.  

- **Employer / Recruiter**  
  - Creates company profiles.  
  - Posts and manages jobs.  
  - Reviews applications from DeepPivot job seekers.  

- **Admin (DeepPivot team)**  
  - Uses `/admin` dashboard for archetype review and will gain job marketplace moderation tools.  

### 5.2 Key Flows

1. A learner completes an AI interview session and receives feedback → DeepPivot suggests relevant jobs on the new marketplace, which the learner can apply to and track.  

2. An employer posts a job on DeepPivot → job seekers discover it via marketplace search and their dashboard, apply using their profile and resume, and track the application in their Job Tracker.  

3. Admin monitors both AI‑generated archetypes (existing) and new job content (new) from a unified admin area.  

---

## 6. Functional Requirements

### 6.1 Core DeepPivot Platform (Baseline)

DeepPivot’s current roadmap and shipped features (LP1–LP9, JT1–JT7, voice interview pipeline, archetyping, career plans, mentors, education explorer) remain as defined in `ROADMAP.md` and serve as the central foundation.  

No functional changes are required here beyond adding navigation / integration anchors to the new job marketplace (see 6.4).  

---

### 6.2 Job Marketplace – Job Seeker Features

These map directly from the Indeed Clone PRD but will be implemented as **new routes and APIs inside DeepPivot’s Next.js app**.  

#### 6.2.1 Job Search & Listing

- Job search page under `/jobs` or `/dashboard/jobs`, integrated in the dashboard shell.  
- Keyword + location search with filters (job type, experience level, remote/on‑site, salary range).  
- Paginated results with job title, company, location, salary snippet, posted date.  

**Acceptance Criteria:**

- AC‑JM‑SEARCH‑1: A logged‑in learner can search and filter jobs from the dashboard.  
- AC‑JM‑SEARCH‑2: Filters and pagination work without losing context.  
- AC‑JM‑SEARCH‑3: Search performance respects DeepPivot’s performance baselines.  

#### 6.2.2 Job Detail Page

- New route `/jobs/[jobId]` with full job details and actions.  

**Acceptance Criteria:**

- AC‑JM‑DETAIL‑1: Job detail fully renders from any list or recommendation.  
- AC‑JM‑DETAIL‑2: “Apply” launches DeepPivot’s unified application flow.  
- AC‑JM‑DETAIL‑3: “Save job” adds the job to the learner’s saved list and a Job Tracker board entry.  

#### 6.2.3 Marketplace Application Flow

- Unified application form that reuses DeepPivot’s profile fields where possible (name, summary, resume).  
- On submission, create both:  
  - A **Job Marketplace Application** record (for employer view).  
  - A **Job Tracker card** in `job_applications` for the learner.  

**Acceptance Criteria:**

- AC‑JM‑APP‑1: Applying to a marketplace job creates a tracker card automatically.  
- AC‑JM‑APP‑2: Duplicate applications to the same job are prevented or clearly handled.  
- AC‑JM‑APP‑3: Application status changes made by employers are reflected in the learner’s Job Tracker view.  

---

### 6.3 Job Marketplace – Employer & Admin Features

#### 6.3.1 Employer Onboarding & Company Profile

- Employers sign up via existing auth and are flagged as employer role in `users`.  
- Company profiles stored in a new `companies` table linked to users.  

**Acceptance Criteria:**

- AC‑EMP‑1: Employer can create/edit a company profile within DeepPivot.  
- AC‑EMP‑2: Company info appears on job detail pages.  

#### 6.3.2 Job Posting & Management

- Employers access `/employer/jobs` to create, edit, and manage job postings.  
- Jobs stored in a new `jobs` table using DeepPivot’s Postgres + ORM patterns.  

**Acceptance Criteria:**

- AC‑EMP‑JOB‑1: Employers can create jobs with drafts and published states.  
- AC‑EMP‑JOB‑2: Published jobs appear in marketplace search.  
- AC‑EMP‑JOB‑3: Closed jobs no longer accept applications and are hidden from search.  

#### 6.3.3 Application Review

- Employers view applications per job with applicant profile snippet and resume link.  
- Status changes propagate back to learners’ Job Tracker cards.  

**Acceptance Criteria:**

- AC‑EMP‑APP‑1: Employers see all applications for their jobs.  
- AC‑EMP‑APP‑2: Changing status updates the underlying Job Tracker entry.  

#### 6.3.4 Admin Moderation

- Extend DeepPivot’s `/admin` area to include job and company review tools.  

**Acceptance Criteria:**

- AC‑ADMIN‑JM‑1: Admin can view, approve, or remove job posts.  
- AC‑ADMIN‑JM‑2: Admin can suspend abusive employers while preserving learner data.  

---

### 6.4 Integration Points with Existing DeepPivot Features

1. **Dashboard Navigation**  
   - Add “Job Marketplace” section to `/dashboard` alongside Interviews, Job Tracker, Career Plan, Mentors, Education.  

2. **Job Tracker Sync**  
   - Extend `job_applications` schema to link to either external jobs or internal `jobs` table.  

3. **Interview Feedback → Job Suggestions (Future)**  
   - Logging hook: after an interview session, write tags/skills that can be used later for job recommendations.  

4. **Career Plan → Job Recommendations (Future)**  
   - Connect goal titles and target roles in career plans to job search defaults in marketplace views.  

---

## 7. Data Model (New / Extended)

### 7.1 New Core Tables (Job Marketplace)

- **companies**  
  - id, name, logoUrl, website, description, size, industry, location, ownerUserId.  

- **jobs**  
  - id, companyId (FK), title, description, location, jobType, experienceLevel, salaryMin, salaryMax, remoteFlag, status (draft/published/closed), createdAt, updatedAt.  

- **job_marketplace_applications**  
  - id, jobId (FK), userId (FK), resumeUrl, coverLetter, status (new/reviewing/rejected/hired), createdAt, updatedAt.  

### 7.2 Extensions to Existing DeepPivot Tables

- **job_applications** (existing, job tracker)  
  - Add `sourceType` (enum: `external`, `marketplace`).  
  - Add `marketplaceJobId` (nullable FK to `jobs`).  
  - Add `marketplaceApplicationId` (nullable FK to `job_marketplace_applications`).  

This allows unified kanban views across external and internal jobs.  

---

## 8. Non‑Functional Requirements

The job marketplace inherits DeepPivot’s existing non‑functional standards (Next.js, Neon, Drizzle, Vercel) and the performance/security expectations from the Indeed Clone PRD.  

- **Performance:** Search and listing endpoints respond within 500–700 ms at p95.  
- **Security:** Use platform auth, server‑side role checks, and robust input validation.  
- **Reliability:** Handle transient database errors gracefully; log key events.  
- **Usability:** Responsive design consistent with existing dashboard, using the shared component system.  

---

## 9. Implementation Strategy (High‑Level)

Implementation will **follow the structure of ROADMAP.md** (phased issues, `bd` tooling, `.beads`), with the job marketplace introduced as a new epic that plugs into the existing phases.  

### Phase A — Backend Foundation for Job Marketplace

- Implement `companies`, `jobs`, `job_marketplace_applications` tables and ORM models.  
- Extend `job_applications` with marketplace linkage fields.  
- Add API routes for CRUD (jobs, companies, applications).  

### Phase B — Employer Experience

- Employer onboarding, company management, job posting UI in dashboard shell.  

### Phase C — Job Seeker Marketplace UI

- `/jobs` listing, `/jobs/[jobId]` detail, unified application flow, Job Tracker integration.  

### Phase D — Admin & Moderation

- Extend `/admin` with company/job moderation and logs.  

### Phase E — Light Intelligence Hooks

- Log interview outcomes and career plan data that can later improve recommendations (future; not required for initial marketplace MVP).  

---

## 10. Open Questions

- Should employers be able to see any interview‑derived metrics (e.g., star rating, archetype) or should that remain private to learners?  
- Do we require separate pricing/tiers for employers before launching the marketplace publicly?  
- Where in the dashboard hierarchy should “Job Marketplace” live for maximum discoverability without overwhelming users?  

---

**This PRD supersedes the standalone Indeed Clone spec as a separate app, and instead embeds its functionality into DeepPivot as the central project defined by `ROADMAP.md`, with the job marketplace treated as a major integrated feature family.**
