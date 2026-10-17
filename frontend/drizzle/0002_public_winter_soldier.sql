CREATE TABLE `reviewer_links` (
	`id` varchar(36) NOT NULL,
	`sessionId` varchar(36) NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`revokedAt` timestamp,
	CONSTRAINT `reviewer_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviewer_links_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `reviewer_links` ADD CONSTRAINT `reviewer_links_sessionId_assessment_sessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `assessment_sessions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `reviewer_links_session_idx` ON `reviewer_links` (`sessionId`);--> statement-breakpoint
CREATE INDEX `reviewer_links_expires_at_idx` ON `reviewer_links` (`expiresAt`);