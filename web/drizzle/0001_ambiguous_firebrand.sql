CREATE TABLE `waterLog` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`amountMl` integer NOT NULL,
	`datetime` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `profile` ADD `waterGoalMl` integer DEFAULT 2500 NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `remindersEnabled` integer DEFAULT true NOT NULL;