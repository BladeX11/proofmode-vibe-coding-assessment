CREATE TABLE `assessment_sessions` (
	`id` varchar(36) NOT NULL,
	`assessmentSlug` varchar(128) NOT NULL,
	`assessmentVersion` int NOT NULL,
	`status` enum('in_progress','submitted','expired') NOT NULL DEFAULT 'in_progress',
	`candidateUserId` int,
	`accessTokenHash` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`submittedAt` timestamp,
	CONSTRAINT `assessment_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `assessment_sessions_accessTokenHash_unique` UNIQUE(`accessTokenHash`)
);
--> statement-breakpoint
CREATE TABLE `code_submissions` (
	`id` varchar(36) NOT NULL,
	`sessionId` varchar(36) NOT NULL,
	`sourceCode` longtext NOT NULL,
	`sourceCodeSha256` varchar(64) NOT NULL,
	`language` varchar(32) NOT NULL,
	`submissionVersion` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `code_submissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `code_submissions_session_version_unique` UNIQUE(`sessionId`,`submissionVersion`)
);
--> statement-breakpoint
CREATE TABLE `execution_case_results` (
	`id` varchar(36) NOT NULL,
	`executionRunId` varchar(36) NOT NULL,
	`caseIndex` int NOT NULL,
	`inputValue` longtext NOT NULL,
	`expectedOutput` longtext NOT NULL,
	`actualOutput` longtext,
	`passed` boolean NOT NULL DEFAULT false,
	`errorDetails` longtext,
	CONSTRAINT `execution_case_results_id` PRIMARY KEY(`id`),
	CONSTRAINT `execution_case_results_run_case_unique` UNIQUE(`executionRunId`,`caseIndex`)
);
--> statement-breakpoint
CREATE TABLE `execution_runs` (
	`id` varchar(36) NOT NULL,
	`sessionId` varchar(36) NOT NULL,
	`submissionId` varchar(36) NOT NULL,
	`status` enum('passed','failed','error','timeout') NOT NULL,
	`passedCases` int NOT NULL DEFAULT 0,
	`totalCases` int NOT NULL DEFAULT 0,
	`durationMs` int NOT NULL DEFAULT 0,
	`runnerVersion` varchar(64) NOT NULL,
	`sandboxImage` varchar(128) NOT NULL,
	`errorSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `execution_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assessment_sessions` ADD CONSTRAINT `assessment_sessions_candidateUserId_users_id_fk` FOREIGN KEY (`candidateUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `code_submissions` ADD CONSTRAINT `code_submissions_sessionId_assessment_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `assessment_sessions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `execution_case_results` ADD CONSTRAINT `execution_case_results_executionRunId_execution_runs_id_fk` FOREIGN KEY (`executionRunId`) REFERENCES `execution_runs`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `execution_runs` ADD CONSTRAINT `execution_runs_sessionId_assessment_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `assessment_sessions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `execution_runs` ADD CONSTRAINT `execution_runs_submissionId_code_submissions_id_fk` FOREIGN KEY (`submissionId`) REFERENCES `code_submissions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `assessment_sessions_assessment_slug_idx` ON `assessment_sessions` (`assessmentSlug`);--> statement-breakpoint
CREATE INDEX `assessment_sessions_candidate_user_id_idx` ON `assessment_sessions` (`candidateUserId`);--> statement-breakpoint
CREATE INDEX `assessment_sessions_status_idx` ON `assessment_sessions` (`status`);--> statement-breakpoint
CREATE INDEX `code_submissions_session_idx` ON `code_submissions` (`sessionId`);--> statement-breakpoint
CREATE INDEX `code_submissions_source_hash_idx` ON `code_submissions` (`sourceCodeSha256`);--> statement-breakpoint
CREATE INDEX `execution_case_results_execution_run_idx` ON `execution_case_results` (`executionRunId`);--> statement-breakpoint
CREATE INDEX `execution_runs_session_idx` ON `execution_runs` (`sessionId`);--> statement-breakpoint
CREATE INDEX `execution_runs_submission_idx` ON `execution_runs` (`submissionId`);--> statement-breakpoint
CREATE INDEX `execution_runs_status_idx` ON `execution_runs` (`status`);