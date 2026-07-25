CREATE TABLE `weeklyTargetUpdate` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`weekStart` text NOT NULL,
	`previousTargetKcal` integer NOT NULL,
	`suggestedTargetKcal` integer NOT NULL,
	`estimatedTdeeKcal` integer NOT NULL,
	`avgIntakeKcal` integer NOT NULL,
	`weightDeltaKg` real NOT NULL,
	`daysLogged` integer NOT NULL,
	`confidence` text NOT NULL,
	`accepted` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `profile` ADD `currentTargetKcal` integer;