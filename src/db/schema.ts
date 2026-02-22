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

export const usersRelations = relations(usersTable, ({ many }) => ({
  jobBoards: many(jobBoardsTable),
  interviewSessions: many(interviewSessionsTable),
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