CREATE INDEX `account_userId_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE INDEX `aiUsageLog_userId_createdAt_idx` ON `aiUsageLog` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `foodLog_userId_datetime_idx` ON `foodLog` (`userId`,`datetime`);--> statement-breakpoint
CREATE INDEX `food_name_idx` ON `food` (`name`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE INDEX `waterLog_userId_datetime_idx` ON `waterLog` (`userId`,`datetime`);