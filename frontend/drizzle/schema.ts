import {
  boolean,
  index,
  int,
  longtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const assessmentSessions = mysqlTable(
  "assessment_sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    assessmentSlug: varchar("assessmentSlug", { length: 128 }).notNull(),
    assessmentVersion: int("assessmentVersion").notNull(),
    status: mysqlEnum("status", ["in_progress", "submitted", "expired"])
      .default("in_progress")
      .notNull(),
    candidateUserId: int("candidateUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    accessTokenHash: varchar("accessTokenHash", { length: 64 }).notNull().unique(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    submittedAt: timestamp("submittedAt"),
  },
  (table) => ({
    assessmentSlugIdx: index("assessment_sessions_assessment_slug_idx").on(
      table.assessmentSlug,
    ),
    candidateUserIdx: index("assessment_sessions_candidate_user_id_idx").on(
      table.candidateUserId,
    ),
    statusIdx: index("assessment_sessions_status_idx").on(table.status),
  }),
);

export const reviewerLinks = mysqlTable(
  "reviewer_links",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    sessionId: varchar("sessionId", { length: 36 })
      .notNull()
      .references(() => assessmentSessions.id, { onDelete: "restrict" }),
    tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt"),
    revokedAt: timestamp("revokedAt"),
  },
  (table) => ({
    sessionIdx: index("reviewer_links_session_idx").on(table.sessionId),
    expiresAtIdx: index("reviewer_links_expires_at_idx").on(table.expiresAt),
  }),
);

export const codeSubmissions = mysqlTable(
  "code_submissions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    sessionId: varchar("sessionId", { length: 36 })
      .notNull()
      .references(() => assessmentSessions.id, { onDelete: "restrict" }),
    sourceCode: longtext("sourceCode").notNull(),
    sourceCodeSha256: varchar("sourceCodeSha256", { length: 64 }).notNull(),
    language: varchar("language", { length: 32 }).notNull(),
    submissionVersion: int("submissionVersion").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    sessionIdx: index("code_submissions_session_idx").on(table.sessionId),
    sourceHashIdx: index("code_submissions_source_hash_idx").on(
      table.sourceCodeSha256,
    ),
    sessionVersionUnique: uniqueIndex(
      "code_submissions_session_version_unique",
    ).on(table.sessionId, table.submissionVersion),
  }),
);

export const executionRuns = mysqlTable(
  "execution_runs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    sessionId: varchar("sessionId", { length: 36 })
      .notNull()
      .references(() => assessmentSessions.id, { onDelete: "restrict" }),
    submissionId: varchar("submissionId", { length: 36 })
      .notNull()
      .references(() => codeSubmissions.id, { onDelete: "restrict" }),
    status: mysqlEnum("status", ["passed", "failed", "error", "timeout"]).notNull(),
    passedCases: int("passedCases").notNull().default(0),
    totalCases: int("totalCases").notNull().default(0),
    durationMs: int("durationMs").notNull().default(0),
    runnerVersion: varchar("runnerVersion", { length: 64 }).notNull(),
    sandboxImage: varchar("sandboxImage", { length: 128 }).notNull(),
    errorSummary: text("errorSummary"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    sessionIdx: index("execution_runs_session_idx").on(table.sessionId),
    submissionIdx: index("execution_runs_submission_idx").on(table.submissionId),
    statusIdx: index("execution_runs_status_idx").on(table.status),
  }),
);

export const executionCaseResults = mysqlTable(
  "execution_case_results",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    executionRunId: varchar("executionRunId", { length: 36 })
      .notNull()
      .references(() => executionRuns.id, { onDelete: "restrict" }),
    caseIndex: int("caseIndex").notNull(),
    inputValue: longtext("inputValue").notNull(),
    expectedOutput: longtext("expectedOutput").notNull(),
    actualOutput: longtext("actualOutput"),
    passed: boolean("passed").notNull().default(false),
    errorDetails: longtext("errorDetails"),
  },
  (table) => ({
    executionRunIdx: index("execution_case_results_execution_run_idx").on(
      table.executionRunId,
    ),
    caseIndexUnique: uniqueIndex("execution_case_results_run_case_unique").on(
      table.executionRunId,
      table.caseIndex,
    ),
  }),
);

export type AssessmentSession = typeof assessmentSessions.$inferSelect;
export type InsertAssessmentSession = typeof assessmentSessions.$inferInsert;
export type ReviewerLink = typeof reviewerLinks.$inferSelect;
export type InsertReviewerLink = typeof reviewerLinks.$inferInsert;
export type CodeSubmission = typeof codeSubmissions.$inferSelect;
export type InsertCodeSubmission = typeof codeSubmissions.$inferInsert;
export type ExecutionRun = typeof executionRuns.$inferSelect;
export type InsertExecutionRun = typeof executionRuns.$inferInsert;
export type ExecutionCaseResult = typeof executionCaseResults.$inferSelect;
export type InsertExecutionCaseResult = typeof executionCaseResults.$inferInsert;