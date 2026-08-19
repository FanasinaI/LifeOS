CREATE TABLE `exchange_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`base_currency` text NOT NULL,
	`quote_currency` text NOT NULL,
	`rate` real NOT NULL,
	`date` integer NOT NULL,
	`created_at` integer NOT NULL
);
