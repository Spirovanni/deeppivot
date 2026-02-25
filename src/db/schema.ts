import { boolean, integer, jsonb, pgTable, real, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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

});

// ============================================
// USER RELATIONS
// ============================================

export const usersRelations = relations(usersTable, ({ many, one }) => ({
  jobBoards: many(jobBoardsTable),
  interviewSessions: many(interviewSessionsTable),
  careerArchetype: one(careerArchetypesTable),
  careerMilestones: many(careerMilestonesTable),
  mentorConnections: many(mentorConnectionsTable),
  subscription: one(subscriptionsTable),
  agentConfigs: many(agentConfigsTable),
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
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const jobApplicationsRelations = relations(jobApplicationsTable, ({ one }) => ({
  column: one(jobColumnsTable, {
    fields: [jobApplicationsTable.columnId],
    references: [jobColumnsTable.id],
  }),
}));

// ============================================
// INTERVIEW SESSION MODELS (LP2)
// ============================================

export const interviewSessionsTable = pgTable("interview_sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  sessionType: varchar({ length: 50 }).notNull().default("general"),
  status: varchar({ length: 20 }).notNull().default("active"),
  startedAt: timestamp().notNull().defaultNow(),
  endedAt: timestamp(),
  overallScore: integer(),
  notes: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const interviewSessionsRelations = relations(interviewSessionsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [interviewSessionsTable.userId],
    references: [usersTable.id],
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
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
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