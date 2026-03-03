import { boolean, integer, jsonb, pgTable, real, text, timestamp, unique, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { ResumeExtraction } from "@/src/lib/llm/prompts/resumes";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clerkId: varchar({ length: 255 }).notNull().unique(),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(), // Keep for backward compatibility
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  role: varchar({ length: 255 }).notNull().default("user"),
  status: varchar({ length: 255 }).notNull().default("active"),
  isVerified: boolean().notNull().default(false),
  isActive: boolean().notNull().default(true),
  isDeleted: boolean().notNull().default(false),
  isSuspended: boolean().notNull().default(false),
  isLocked: boolean().notNull().default(false),
  isEmailVerified: boolean().notNull().default(false),
  isPhoneVerified: boolean().notNull().default(false),
  isPremium: boolean().notNull().default(false),
  isTrial: boolean().notNull().default(false),
  isTrialExpired: boolean().notNull().default(false),
  isTrialStarted: boolean().notNull().default(false),
  isTrialEnded: boolean().notNull().default(false),
  credits: integer().notNull().default(0),
  creditsUsed: integer().notNull().default(0),
  creditsRemaining: integer().notNull().default(0),
  creditsExhausted: boolean().notNull().default(false),
  creditsExhaustedAt: timestamp(),
  creditsExhaustedReason: varchar({ length: 255 }).notNull().default(""),
  creditsExhaustedReasonDescription: varchar({ length: 255 }).notNull().default(""),

  // ── Profile fields ────────────────────────────────────────────────────────
  /** Public avatar URL — stored in R2; null = use Clerk avatar */
  avatarUrl: varchar({ length: 1024 }),
  /** Short personal bio for the learner profile */
  bio: text(),
  /** Phone number (optional) */
  phone: varchar({ length: 50 }),
  /** Preferred pronoun string (e.g. "he/him") */
  pronouns: varchar({ length: 50 }),
  /** LinkedIn profile URL */
  linkedinUrl: varchar({ length: 1024 }),

  /** Phase 16.5: Allow employers to see profile in "Top Candidate Matches" / opportunity discovery */
  openToOpportunities: boolean().notNull().default(false),

  // ── WDB integration ───────────────────────────────────────────────────────
  /** Salesforce Contact ID for this user's WDB record (null = not a WDB client) */
  wdbSalesforceContactId: varchar({ length: 255 }),
  /** The WDB case plan number or reference ID */
  wdbCasePlanId: varchar({ length: 255 }),
  /** WDB enrollment date */
  wdbEnrolledAt: timestamp(),

  // ── Soft delete ───────────────────────────────────────────────────────────
  /** Set when the user requests account deletion; row is preserved for analytics */
  deletedAt: timestamp(),

  // ── Multi-tenancy ─────────────────────────────────────────────────────────
  /** Clerk Organization ID for white-labeling / B2B multi-tenancy */
  organizationId: varchar({ length: 255 }),
});

// ============================================
// USER GAMIFICATION (Phase 16.4)
// ============================================

export const userGamificationTable = pgTable("user_gamification", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  points: integer().notNull().default(0),
  currentStreak: integer().notNull().default(0),
  highestStreak: integer().notNull().default(0),
  isPublic: boolean().notNull().default(false),
  lastActivityAt: timestamp(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const userGamificationRelations = relations(userGamificationTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userGamificationTable.userId],
    references: [usersTable.id],
  }),
}));

// USER BADGES (Phase 16.4)
// ============================================

export const userBadgesTable = pgTable("user_badges", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  badgeId: varchar({ length: 64 }).notNull(),
  unlockedAt: timestamp().notNull().defaultNow(),
}, (table) => [
  unique().on(table.userId, table.badgeId),
  index("idx_user_badges_user_id").on(table.userId),
]);

export const userBadgesRelations = relations(userBadgesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userBadgesTable.userId],
    references: [usersTable.id],
  }),
}));

// GAMIFICATION EVENTS AUDIT LOG (Phase 16.4)
// ============================================

export const gamificationEventsTable = pgTable("gamification_events", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  eventType: varchar({ length: 64 }).notNull(),
  points: integer().notNull().default(0),
  metadata: jsonb(),
  createdAt: timestamp().notNull().defaultNow(),
}, (table) => [
  index("idx_gamification_events_user_id").on(table.userId),
  index("idx_gamification_events_type").on(table.eventType),
  index("idx_gamification_events_created_at").on(table.createdAt),
]);

export const gamificationEventsRelations = relations(gamificationEventsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [gamificationEventsTable.userId],
    references: [usersTable.id],
  }),
}));

// ============================================
// USER RELATIONS
// ============================================

export const usersRelations = relations(usersTable, ({ many, one }) => ({
  gamification: one(userGamificationTable),
  badges: many(userBadgesTable),
  gamificationEvents: many(gamificationEventsTable),
  jobBoards: many(jobBoardsTable),
  interviewSessions: many(interviewSessionsTable),
  careerArchetype: one(careerArchetypesTable),
  careerMilestones: many(careerMilestonesTable),
  mentorConnections: many(mentorConnectionsTable),
  subscription: one(subscriptionsTable),
  agentConfigs: many(agentConfigsTable),
  companies: many(companiesTable),
  jobMarketplaceApplications: many(jobMarketplaceApplicationsTable),
  jobMatches: many(jobMatchesTable),
  jobDescriptions: many(jobDescriptionsTable),
  resumes: many(userResumesTable),
  notifications: many(notificationsTable),
}));

// ============================================
// NOTIFICATIONS (Phase 16.3)
// ============================================

export const notificationsTable = pgTable("notifications", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull(),
  body: text().notNull(),
  /** Whether the user has read this notification */
  isRead: boolean().notNull().default(false),
  /** Notification category: system | interview | mentor | career | announcement */
  type: varchar({ length: 50 }).notNull().default("system"),
  /** Optional deep-link path within the app (e.g. "/dashboard/interviews/42/feedback") */
  link: varchar({ length: 1024 }),
  createdAt: timestamp().notNull().defaultNow(),
}, (table) => {
  return [
    index("notifications_user_idx").on(table.userId),
    index("notifications_user_read_idx").on(table.userId, table.isRead),
    index("notifications_type_idx").on(table.type),
  ];
});

export const notificationsRelations = relations(notificationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [notificationsTable.userId],
    references: [usersTable.id],
  }),
}));

// ============================================
// ADMIN ANNOUNCEMENTS (Phase 16.3)
// ============================================

export const adminAnnouncementsTable = pgTable("admin_announcements", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  body: text().notNull(),
  /** When true, users are force-redirected to this announcement on dashboard entry until dismissed (deeppivot-257) */
  sendToHome: boolean().notNull().default(false),
  createdBy: integer().references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp().notNull().defaultNow(),
}, (table) => {
  return [index("admin_announcements_created_idx").on(table.createdAt)];
});

export const adminAnnouncementsRelations = relations(adminAnnouncementsTable, ({ one }) => ({
  creator: one(usersTable, {
    fields: [adminAnnouncementsTable.createdBy],
    references: [usersTable.id],
  }),
}));

/** Tracks which users have dismissed "Send to Home" announcements (deeppivot-257) */
export const userAnnouncementDismissalsTable = pgTable(
  "user_announcement_dismissals",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    announcementId: integer().notNull().references(() => adminAnnouncementsTable.id, { onDelete: "cascade" }),
    dismissedAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    unique("user_announcement_dismissals_user_announcement").on(table.userId, table.announcementId),
  ]
);

export const userAnnouncementDismissalsRelations = relations(userAnnouncementDismissalsTable, ({ one }) => ({
  user: one(usersTable, { fields: [userAnnouncementDismissalsTable.userId], references: [usersTable.id] }),
  announcement: one(adminAnnouncementsTable, { fields: [userAnnouncementDismissalsTable.announcementId], references: [adminAnnouncementsTable.id] }),
}));

// ============================================
// JOB TRACKER MODELS (Epicflow Extension)
// ============================================

export const jobBoardsTable = pgTable("job_boards", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull().default("Job Hunt"),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const jobBoardsRelations = relations(jobBoardsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [jobBoardsTable.userId],
    references: [usersTable.id],
  }),
  columns: many(jobColumnsTable),
}));

export const jobColumnsTable = pgTable("job_columns", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  order: integer().notNull().default(0),
  boardId: integer().notNull().references(() => jobBoardsTable.id, { onDelete: "cascade" }),
});

export const jobColumnsRelations = relations(jobColumnsTable, ({ one, many }) => ({
  board: one(jobBoardsTable, {
    fields: [jobColumnsTable.boardId],
    references: [jobBoardsTable.id],
  }),
  jobs: many(jobApplicationsTable),
}));

export const jobApplicationsTable = pgTable("job_applications", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  company: varchar({ length: 255 }).notNull(),
  position: varchar({ length: 255 }).notNull(),
  location: varchar({ length: 255 }),
  salary: varchar({ length: 255 }),
  jobUrl: varchar({ length: 1024 }),
  status: varchar({ length: 50 }).notNull().default("applied"),
  tags: text().array().notNull().default([]),
  description: text(),
  notes: text(),
  order: integer().notNull().default(0),
  columnId: integer().notNull().references(() => jobColumnsTable.id, { onDelete: "cascade" }),
  userId: integer().notNull(),
  workflowId: varchar({ length: 255 }),
  /** Source: 'external' (manually added) | 'marketplace' (applied via DeepPivot marketplace) */
  sourceType: varchar({ length: 20 }).notNull().default("external"),
  /** FK to marketplace job (null for external entries) */
  marketplaceJobId: integer().references(() => jobsTable.id, { onDelete: "set null" }),
  /** FK to the marketplace application row (null for external entries) */
  marketplaceApplicationId: integer().references(() => jobMarketplaceApplicationsTable.id, { onDelete: "set null" }),
  /** Direct link to AI-generated cover letter (deeppivot-235) */
  coverLetterId: integer().references(() => coverLettersTable.id, { onDelete: "set null" }),
  /** Link to job description (enables cover letter + context-aware interview) */
  jobDescriptionId: integer().references(() => jobDescriptionsTable.id, { onDelete: "set null" }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
}, (table) => {
  return [
    index("job_applications_user_column_idx").on(table.userId, table.columnId),
    index("job_applications_status_idx").on(table.status),
  ];
});

export const jobApplicationsRelations = relations(jobApplicationsTable, ({ one }) => ({
  column: one(jobColumnsTable, {
    fields: [jobApplicationsTable.columnId],
    references: [jobColumnsTable.id],
  }),
  marketplaceJob: one(jobsTable, {
    fields: [jobApplicationsTable.marketplaceJobId],
    references: [jobsTable.id],
  }),
  marketplaceApplication: one(jobMarketplaceApplicationsTable, {
    fields: [jobApplicationsTable.marketplaceApplicationId],
    references: [jobMarketplaceApplicationsTable.id],
  }),
  coverLetter: one(coverLettersTable, {
    fields: [jobApplicationsTable.coverLetterId],
    references: [coverLettersTable.id],
  }),
  jobDescription: one(jobDescriptionsTable, {
    fields: [jobApplicationsTable.jobDescriptionId],
    references: [jobDescriptionsTable.id],
  }),
}));

// ============================================
// JOB DESCRIPTIONS
// ============================================

export const jobDescriptionsTable = pgTable("job_descriptions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull(),
  company: varchar({ length: 255 }),
  content: text(),
  extractedData: jsonb().default({}),
  /**
   * Pre-computed OpenAI text-embedding-3-small vector (1536 dims) stored as
   * a JSONB float array for fast cosine-similarity retrieval without pgvector.
   * Populated automatically after successful LLM extraction.
   */
  embeddingVector: jsonb("embedding_vector"),
  url: varchar({ length: 1024 }),
  fileUrl: varchar({ length: 1024 }),
  status: varchar({ length: 50 }).notNull().default("pending"),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const jobDescriptionsRelations = relations(jobDescriptionsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [jobDescriptionsTable.userId],
    references: [usersTable.id],
  }),
  interviewSessions: many(interviewSessionsTable),
}));

// ============================================
// USER RESUMES
// ============================================

export const userResumesTable = pgTable("user_resumes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull(),
  fileUrl: varchar({ length: 1024 }),
  rawText: text(),
  /** Parsed resume structure (parsed_resume_data). See ResumeExtraction in src/lib/llm/prompts/resumes.ts */
  parsedData: jsonb()
    .$type<ResumeExtraction>()
    .default({
      fullName: "",
      email: null,
      phone: null,
      location: null,
      summary: null,
      skills: [],
      workExperience: [],
      education: [],
      certifications: [],
      yearsOfExperience: null,
    }),
  status: varchar({ length: 50 }).notNull().default("pending"),
  isDefault: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const userResumesRelations = relations(userResumesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [userResumesTable.userId],
    references: [usersTable.id],
  }),
  interviewSessions: many(interviewSessionsTable),
}));

// ============================================
// COVER LETTERS
// ============================================

export const coverLettersTable = pgTable("cover_letters", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  jobDescriptionId: integer().notNull().references(() => jobDescriptionsTable.id, { onDelete: "cascade" }),
  resumeId: integer().references(() => userResumesTable.id, { onDelete: "set null" }),
  content: text().notNull(),
  tone: varchar({ length: 50 }).notNull().default("professional"),
  status: varchar({ length: 50 }).notNull().default("generated"),
  fileUrl: varchar({ length: 1024 }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const coverLettersRelations = relations(coverLettersTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [coverLettersTable.userId],
    references: [usersTable.id],
  }),
  jobDescription: one(jobDescriptionsTable, {
    fields: [coverLettersTable.jobDescriptionId],
    references: [jobDescriptionsTable.id],
  }),
  resume: one(userResumesTable, {
    fields: [coverLettersTable.resumeId],
    references: [userResumesTable.id],
  }),
}));

// ============================================
// INTERVIEW SESSION MODELS (LP2)
// ============================================

export const interviewSessionsTable = pgTable("interview_sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  /** Links to specific job description context (optional) */
  jobDescriptionId: integer().references(() => jobDescriptionsTable.id, { onDelete: "set null" }),
  /** Links to specific user resume context (optional) */
  resumeId: integer().references(() => userResumesTable.id, { onDelete: "set null" }),
  sessionType: varchar({ length: 50 }).notNull().default("general"),
  status: varchar({ length: 20 }).notNull().default("active"),
  startedAt: timestamp().notNull().defaultNow(),
  endedAt: timestamp(),
  overallScore: integer(),
  notes: text(),
  organizationId: varchar({ length: 255 }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  /** Soft delete — row preserved for analytics after user removes it */
  deletedAt: timestamp(),
}, (table) => {
  return [
    index("interview_sessions_user_idx").on(table.userId),
    index("interview_sessions_status_idx").on(table.status),
    index("interview_sessions_org_idx").on(table.organizationId),
    index("interview_sessions_job_desc_idx").on(table.jobDescriptionId),
    index("interview_sessions_resume_idx").on(table.resumeId),
  ];
});

export const interviewSessionsRelations = relations(interviewSessionsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [interviewSessionsTable.userId],
    references: [usersTable.id],
  }),
  jobDescription: one(jobDescriptionsTable, {
    fields: [interviewSessionsTable.jobDescriptionId],
    references: [jobDescriptionsTable.id],
  }),
  resume: one(userResumesTable, {
    fields: [interviewSessionsTable.resumeId],
    references: [userResumesTable.id],
  }),
  questions: many(interviewQuestionsTable),
  emotionSnapshots: many(emotionSnapshotsTable),
  recordingUrls: many(recordingUrlsTable),
  transcriptUrls: many(transcriptUrlsTable),
  emotionalAnalyses: many(emotionalAnalysesTable),
  interviewFeedback: many(interviewFeedbackTable),
}));

export const recordingUrlsTable = pgTable("recording_urls", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer()
    .notNull()
    .references(() => interviewSessionsTable.id, { onDelete: "cascade" }),
  url: varchar({ length: 1024 }).notNull(),
  source: varchar({ length: 50 }).notNull().default("vapi"),
  createdAt: timestamp().notNull().defaultNow(),
});

export const recordingUrlsRelations = relations(recordingUrlsTable, ({ one }) => ({
  session: one(interviewSessionsTable, {
    fields: [recordingUrlsTable.sessionId],
    references: [interviewSessionsTable.id],
  }),
}));

export const transcriptUrlsTable = pgTable("transcript_urls", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer()
    .notNull()
    .references(() => interviewSessionsTable.id, { onDelete: "cascade" }),
  url: varchar({ length: 1024 }).notNull(),
  recordingUrlId: integer().references(() => recordingUrlsTable.id, { onDelete: "set null" }),
  createdAt: timestamp().notNull().defaultNow(),
});

export const transcriptUrlsRelations = relations(transcriptUrlsTable, ({ one }) => ({
  session: one(interviewSessionsTable, {
    fields: [transcriptUrlsTable.sessionId],
    references: [interviewSessionsTable.id],
  }),
  recordingUrl: one(recordingUrlsTable, {
    fields: [transcriptUrlsTable.recordingUrlId],
    references: [recordingUrlsTable.id],
  }),
}));

export const emotionalAnalysesTable = pgTable("emotional_analysis", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer()
    .notNull()
    .references(() => interviewSessionsTable.id, { onDelete: "cascade" }),
  /** Hume batch job ID */
  jobId: varchar({ length: 255 }).notNull(),
  /** Full Hume prosody result: snapshots, aggregateEmotions, overallDominantEmotion */
  data: jsonb().notNull().default({}),
  createdAt: timestamp().notNull().defaultNow(),
});

export const emotionalAnalysesRelations = relations(emotionalAnalysesTable, ({ one }) => ({
  session: one(interviewSessionsTable, {
    fields: [emotionalAnalysesTable.sessionId],
    references: [interviewSessionsTable.id],
  }),
}));

export const interviewFeedbackTable = pgTable("interview_feedback", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer()
    .notNull()
    .references(() => interviewSessionsTable.id, { onDelete: "cascade" }),
  /** Structured feedback content (e.g. Strengths, Areas for Improvement) */
  content: text().notNull(),
  /** Sentiment score 0–100 if computed */
  sentimentScore: integer(),
  /** Career skills mapping: { skill: string; score: number; note?: string }[] — used by career plan builder */
  skillsMapping: jsonb().default([]),
  createdAt: timestamp().notNull().defaultNow(),
});

export const interviewFeedbackRelations = relations(interviewFeedbackTable, ({ one }) => ({
  session: one(interviewSessionsTable, {
    fields: [interviewFeedbackTable.sessionId],
    references: [interviewSessionsTable.id],
  }),
}));

export const interviewQuestionsTable = pgTable("interview_questions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer().notNull().references(() => interviewSessionsTable.id, { onDelete: "cascade" }),
  questionText: text().notNull(),
  questionCategory: varchar({ length: 100 }).notNull().default("general"),
  responseQuality: integer(),
  orderIndex: integer().notNull().default(0),
  createdAt: timestamp().notNull().defaultNow(),
});

export const interviewQuestionsRelations = relations(interviewQuestionsTable, ({ one }) => ({
  session: one(interviewSessionsTable, {
    fields: [interviewQuestionsTable.sessionId],
    references: [interviewSessionsTable.id],
  }),
}));

export const emotionSnapshotsTable = pgTable("emotion_snapshots", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer().notNull().references(() => interviewSessionsTable.id, { onDelete: "cascade" }),
  capturedAt: timestamp().notNull().defaultNow(),
  emotions: jsonb().notNull().default({}),
  dominantEmotion: varchar({ length: 100 }).notNull().default(""),
  confidence: real().notNull().default(0),
});

export const emotionSnapshotsRelations = relations(emotionSnapshotsTable, ({ one }) => ({
  session: one(interviewSessionsTable, {
    fields: [emotionSnapshotsTable.sessionId],
    references: [interviewSessionsTable.id],
  }),
}));

// ============================================
// CAREER ARCHETYPE MODEL (LP6)
// ============================================

export const careerArchetypesTable = pgTable("career_archetypes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  archetypeName: varchar({ length: 100 }).notNull(),
  // jsonb: { dimension: string; score: number; normalized: number }[]
  traits: jsonb().notNull().default([]),
  strengths: text().array().notNull().default([]),
  growthAreas: text().array().notNull().default([]),
  assessedAt: timestamp().notNull().defaultNow(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const careerArchetypesRelations = relations(careerArchetypesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [careerArchetypesTable.userId],
    references: [usersTable.id],
  }),
  reviewItems: many(archetypeReviewQueueTable),
}));

// ============================================
// ARCHETYPE REVIEW QUEUE (Admin human review)
// ============================================

export const archetypeReviewQueueTable = pgTable("archetype_review_queue", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  careerArchetypeId: integer()
    .notNull()
    .references(() => careerArchetypesTable.id, { onDelete: "cascade" }),
  sessionId: integer()
    .notNull()
    .references(() => interviewSessionsTable.id, { onDelete: "cascade" }),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  /** Input: interview feedback content used for archetyping */
  feedbackContent: text().notNull(),
  /** AI output: archetype name */
  aiArchetypeName: varchar({ length: 100 }).notNull(),
  /** AI output: strengths */
  aiStrengths: jsonb().notNull().default([]),
  /** AI output: growth areas */
  aiGrowthAreas: jsonb().notNull().default([]),
  /** pending | approved | overridden */
  status: varchar({ length: 20 }).notNull().default("pending"),
  reviewedAt: timestamp(),
  reviewedBy: integer().references(() => usersTable.id, { onDelete: "set null" }),
  /** If overridden, the human-selected archetype name */
  overrideArchetypeName: varchar({ length: 100 }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const archetypeReviewQueueRelations = relations(
  archetypeReviewQueueTable,
  ({ one }) => ({
    careerArchetype: one(careerArchetypesTable, {
      fields: [archetypeReviewQueueTable.careerArchetypeId],
      references: [careerArchetypesTable.id],
    }),
    session: one(interviewSessionsTable, {
      fields: [archetypeReviewQueueTable.sessionId],
      references: [interviewSessionsTable.id],
    }),
    user: one(usersTable, {
      fields: [archetypeReviewQueueTable.userId],
      references: [usersTable.id],
    }),
    reviewer: one(usersTable, {
      fields: [archetypeReviewQueueTable.reviewedBy],
      references: [usersTable.id],
    }),
  })
);

// ============================================
// CAREER PLANNING MODELS (LP7)
// ============================================

export const careerMilestonesTable = pgTable("career_milestones", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  targetDate: timestamp(),
  status: varchar({ length: 20 }).notNull().default("planned"),
  orderIndex: integer().notNull().default(0),
  organizationId: varchar({ length: 255 }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  /** Soft delete */
  deletedAt: timestamp(),
});

export const careerMilestonesRelations = relations(careerMilestonesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [careerMilestonesTable.userId],
    references: [usersTable.id],
  }),
  resources: many(careerResourcesTable),
}));

export const careerResourcesTable = pgTable("career_resources", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  milestoneId: integer().notNull().references(() => careerMilestonesTable.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull(),
  url: varchar({ length: 1024 }).notNull(),
  resourceType: varchar({ length: 50 }).notNull().default("article"),
  createdAt: timestamp().notNull().defaultNow(),
});

export const careerResourcesRelations = relations(careerResourcesTable, ({ one }) => ({
  milestone: one(careerMilestonesTable, {
    fields: [careerResourcesTable.milestoneId],
    references: [careerMilestonesTable.id],
  }),
}));

// ============================================
// MENTOR NETWORK MODELS (LP8)
// ============================================

export const mentorsTable = pgTable("mentors", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  /** FK to the user account that owns this mentor profile (nullable for seed/admin-created mentors) */
  userId: integer().references(() => usersTable.id, { onDelete: "set null" }),
  name: varchar({ length: 255 }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  industry: varchar({ length: 100 }).notNull(),
  expertise: text().array().notNull().default([]),
  bio: text().notNull(),
  avatarUrl: varchar({ length: 1024 }),
  contactUrl: varchar({ length: 1024 }),
  linkedinUrl: varchar({ length: 1024 }),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const mentorsRelations = relations(mentorsTable, ({ many }) => ({
  connections: many(mentorConnectionsTable),
}));

export const mentorConnectionsTable = pgTable("mentor_connections", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  mentorId: integer().notNull().references(() => mentorsTable.id, { onDelete: "cascade" }),
  status: varchar({ length: 20 }).notNull().default("pending"),
  message: text(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const mentorConnectionsRelations = relations(mentorConnectionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [mentorConnectionsTable.userId],
    references: [usersTable.id],
  }),
  mentor: one(mentorsTable, {
    fields: [mentorConnectionsTable.mentorId],
    references: [mentorsTable.id],
  }),
}));

// ============================================
// MENTOR FEEDBACK MODEL
// ============================================

/**
 * Mentor-authored comments layered on top of AI-generated interview feedback.
 * One mentor may leave multiple feedback entries on the same session.
 */
export const mentorFeedbackTable = pgTable("mentor_feedback", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  /** The interview session this feedback is attached to */
  sessionId: integer()
    .notNull()
    .references(() => interviewSessionsTable.id, { onDelete: "cascade" }),
  /** The mentor (users.id — the mentor's user record, not mentors.id) */
  mentorUserId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  /** Free-form comment text */
  comment: text().notNull(),
  /** Optional rating 1–5 overlaid on the session */
  rating: integer(),
  /** Internal note — not shown to the learner */
  isPrivate: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const mentorFeedbackRelations = relations(mentorFeedbackTable, ({ one }) => ({
  session: one(interviewSessionsTable, {
    fields: [mentorFeedbackTable.sessionId],
    references: [interviewSessionsTable.id],
  }),
  mentorUser: one(usersTable, {
    fields: [mentorFeedbackTable.mentorUserId],
    references: [usersTable.id],
  }),
}));

// ============================================
// EDUCATION EXPLORER MODELS (LP9)
// ============================================

export const educationProgramsTable = pgTable("education_programs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  provider: varchar({ length: 255 }).notNull(),
  programType: varchar({ length: 50 }).notNull().default("bootcamp"),
  duration: varchar({ length: 100 }).notNull(),
  cost: integer().notNull().default(0), // in cents
  roiScore: integer(), // 0-100
  tags: text().array().notNull().default([]),
  url: varchar({ length: 1024 }).notNull(),
  description: text().notNull(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// ============================================
// SUBSCRIPTIONS MODEL (Billing / Stripe)
// ============================================

export const subscriptionsTable = pgTable("subscriptions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  /** Stripe subscription ID (sub_...) */
  stripeSubscriptionId: varchar({ length: 255 }).unique(),
  /** Stripe customer ID (cus_...) */
  stripeCustomerId: varchar({ length: 255 }),
  /** Stripe price ID (price_...) */
  stripePriceId: varchar({ length: 255 }),
  /** active | trialing | past_due | canceled | incomplete | incomplete_expired | unpaid */
  status: varchar({ length: 50 }).notNull().default("inactive"),
  /** Plan tier: free | pro | enterprise */
  planId: varchar({ length: 50 }).notNull().default("free"),
  /** When the current billing period ends (null for free tier) */
  currentPeriodEnd: timestamp(),
  /** When the subscription was canceled (null if active) */
  canceledAt: timestamp(),
  /** Whether scheduled to cancel at period end */
  cancelAtPeriodEnd: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const subscriptionsRelations = relations(subscriptionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [subscriptionsTable.userId],
    references: [usersTable.id],
  }),
}));

// ============================================
// AGENT CONFIG MODEL (Custom Interview Agents)
// ============================================

export const agentConfigsTable = pgTable("agent_configs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  /** Owner — null means a global/system default config */
  userId: integer().references(() => usersTable.id, { onDelete: "cascade" }),
  /** Human-readable name, e.g. "Behavioral Coach" */
  name: varchar({ length: 255 }).notNull(),
  /** Full system prompt sent to the LLM */
  systemPrompt: text().notNull(),
  /** ElevenLabs voice ID */
  voiceId: varchar({ length: 255 }),
  /** ElevenLabs Conversational AI agent ID */
  elevenLabsAgentId: varchar({ length: 255 }),
  /** Interview category: behavioral | technical | situational | general */
  interviewType: varchar({ length: 50 }).notNull().default("general"),
  /** Whether this config is the active default for the owner */
  isDefault: boolean().notNull().default(false),
  /** Whether this config is visible to all users (system preset) */
  isPublic: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
}, (table) => {
  return [
    index("agent_configs_user_idx").on(table.userId),
    index("agent_configs_type_idx").on(table.interviewType),
  ];
});

export const agentConfigsRelations = relations(agentConfigsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [agentConfigsTable.userId],
    references: [usersTable.id],
  }),
}));

// ============================================
// EDUCATION EXPLORER MODELS (LP9)
// ============================================

export const fundingOpportunitiesTable = pgTable("funding_opportunities", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  fundingType: varchar({ length: 50 }).notNull().default("scholarship"),
  amount: integer(), // in cents, nullable = varies
  eligibilityText: text().notNull(),
  applicationUrl: varchar({ length: 1024 }).notNull(),
  deadline: timestamp(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// ============================================
// JOB MARKETPLACE MODELS (deeppivot-143 to 146)
// ============================================

/**
 * Employer-managed company profiles.
 * One user (employer role) may own one company.
 */
export const companiesTable = pgTable("companies", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  /** The employer user who owns this profile */
  ownerUserId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: varchar({ length: 255 }).notNull(),
  logoUrl: varchar({ length: 1024 }),
  website: varchar({ length: 1024 }),
  description: text(),
  /** Size bucket: 1-10, 11-50, 51-200, 201-500, 500+ */
  size: varchar({ length: 50 }),
  industry: varchar({ length: 100 }),
  location: varchar({ length: 255 }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
}, (table) => {
  return [
    index("companies_owner_idx").on(table.ownerUserId),
  ];
});

export const companiesRelations = relations(companiesTable, ({ one, many }) => ({
  owner: one(usersTable, {
    fields: [companiesTable.ownerUserId],
    references: [usersTable.id],
  }),
  jobs: many(jobsTable),
}));

/**
 * Job postings published by employers.
 */
export const jobsTable = pgTable("jobs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  companyId: integer().notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  location: varchar({ length: 255 }),
  /** full_time | part_time | contract | internship */
  jobType: varchar({ length: 50 }).notNull().default("full_time"),
  /** entry | mid | senior | executive */
  experienceLevel: varchar({ length: 50 }).notNull().default("mid"),
  /** Annual salary in cents (nullable = not disclosed) */
  salaryMin: integer(),
  salaryMax: integer(),
  remoteFlag: boolean().notNull().default(false),
  /** draft | published | closed */
  status: varchar({ length: 20 }).notNull().default("draft"),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const jobsRelations = relations(jobsTable, ({ one, many }) => ({
  company: one(companiesTable, {
    fields: [jobsTable.companyId],
    references: [companiesTable.id],
  }),
  applications: many(jobMarketplaceApplicationsTable),
  matches: many(jobMatchesTable),
  trackerCards: many(jobApplicationsTable),
  invitations: many(employerJobInvitationsTable),
}));

/**
 * Job-seeker applications submitted through the marketplace.
 * Unique per (jobId, userId) — no duplicate applications.
 */
export const jobMarketplaceApplicationsTable = pgTable(
  "job_marketplace_applications",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    jobId: integer().notNull().references(() => jobsTable.id, { onDelete: "cascade" }),
    userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    resumeUrl: varchar({ length: 1024 }),
    coverLetter: text(),
    /** new | reviewing | rejected | hired */
    status: varchar({ length: 20 }).notNull().default("new"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [unique("uq_marketplace_app_job_user").on(t.jobId, t.userId)]
);

export const jobMarketplaceApplicationsRelations = relations(
  jobMarketplaceApplicationsTable,
  ({ one, many }) => ({
    job: one(jobsTable, {
      fields: [jobMarketplaceApplicationsTable.jobId],
      references: [jobsTable.id],
    }),
    user: one(usersTable, {
      fields: [jobMarketplaceApplicationsTable.userId],
      references: [usersTable.id],
    }),
    trackerCards: many(jobApplicationsTable),
  })
);

/**
 * Employer invites a candidate to apply for a job (pre-application outreach).
 * Used for "Top Candidate Matches" flow — employer invites matched candidates.
 */
export const employerJobInvitationsTable = pgTable(
  "employer_job_invitations",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    jobId: integer().notNull().references(() => jobsTable.id, { onDelete: "cascade" }),
    candidateUserId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    invitedByUserId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [unique("uq_employer_invite_job_candidate").on(t.jobId, t.candidateUserId)]
);

export const employerJobInvitationsRelations = relations(
  employerJobInvitationsTable,
  ({ one }) => ({
    job: one(jobsTable, {
      fields: [employerJobInvitationsTable.jobId],
      references: [jobsTable.id],
    }),
    candidate: one(usersTable, {
      fields: [employerJobInvitationsTable.candidateUserId],
      references: [usersTable.id],
    }),
    invitedBy: one(usersTable, {
      fields: [employerJobInvitationsTable.invitedByUserId],
      references: [usersTable.id],
    }),
  })
);

/**
 * Feedback on application outcomes for improving matching weights (Phase 16.5).
 * When employer sets status to hired/rejected, we record signals to learn which
 * factors correlate with success.
 */
export const matchingFeedbackTable = pgTable(
  "matching_feedback",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    marketplaceApplicationId: integer()
      .notNull()
      .references(() => jobMarketplaceApplicationsTable.id, { onDelete: "cascade" }),
    outcome: varchar({ length: 20 }).notNull(), // hired | rejected
    hasResume: boolean().notNull(),
    hasCoverLetter: boolean().notNull(),
    resumeSkillsCount: integer().notNull().default(0),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [unique("uq_matching_feedback_app").on(t.marketplaceApplicationId)]
);

/**
 * Configurable weights for matching algorithm. Updated by feedback aggregation.
 */
export const matchingWeightsTable = pgTable("matching_weights", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  key: varchar({ length: 80 }).notNull().unique(),
  weight: real().notNull().default(1),
  updatedAt: timestamp().notNull().defaultNow(),
});

/**
 * Candidate-to-job match rows produced by the matching engine.
 * One row per (jobId, userId) pair with latest score/status.
 */
export const jobMatchesTable = pgTable(
  "job_matches",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    jobId: integer().notNull().references(() => jobsTable.id, { onDelete: "cascade" }),
    userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    /** 0-100 match percentage score */
    matchScore: integer().notNull().default(0),
    /** suggested | viewed | invited | dismissed | applied */
    status: varchar({ length: 20 }).notNull().default("suggested"),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [
    unique("uq_job_matches_job_user").on(t.jobId, t.userId),
    index("idx_job_matches_job_score").on(t.jobId, t.matchScore),
    index("idx_job_matches_user").on(t.userId),
  ]
);

export const jobMatchesRelations = relations(jobMatchesTable, ({ one }) => ({
  job: one(jobsTable, {
    fields: [jobMatchesTable.jobId],
    references: [jobsTable.id],
  }),
  user: one(usersTable, {
    fields: [jobMatchesTable.userId],
    references: [usersTable.id],
  }),
}));

// ============================================
// SYSTEM SETTINGS (Phase 16.3)
// ============================================

export const systemSettingsTable = pgTable("system_settings", {
  key: varchar({ length: 255 }).primaryKey(),
  value: text().notNull(),
  /** Control UI parsing: boolean | number | string | json */
  type: varchar({ length: 50 }).notNull().default("string"),
  description: text(),
  updatedAt: timestamp().notNull().defaultNow(),
  updatedBy: integer().references(() => usersTable.id, { onDelete: "set null" }),
});

export const systemSettingsRelations = relations(systemSettingsTable, ({ one }) => ({
  updater: one(usersTable, {
    fields: [systemSettingsTable.updatedBy],
    references: [usersTable.id],
  }),
}));