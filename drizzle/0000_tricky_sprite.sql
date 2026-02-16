CREATE TABLE `bills` (
	`id` text PRIMARY KEY NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`official_volume_m3` real NOT NULL,
	`official_total_eur` real NOT NULL,
	`provider_name` text,
	`notes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meter_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`reading_date` text NOT NULL,
	`meter_index_m3` real NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `meter_readings_reading_date_unique` ON `meter_readings` (`reading_date`);