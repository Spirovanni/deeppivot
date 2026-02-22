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

export const careerArchetypesRelations = relations(careerArchetypesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [careerArchetypesTable.userId],
    references: [usersTable.id],
  }),
}));

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