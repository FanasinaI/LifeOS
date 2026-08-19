CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`currency` text DEFAULT 'MGA' NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`period` text NOT NULL,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`amount` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`icon` text,
	`color` text,
	`parent_id` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `debt_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`debt_id` integer NOT NULL,
	`amount` real NOT NULL,
	`date` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `debts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creditor` text NOT NULL,
	`principal` real NOT NULL,
	`remaining` real NOT NULL,
	`currency` text DEFAULT 'MGA' NOT NULL,
	`due_date` integer,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `receivable_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`receivable_id` integer NOT NULL,
	`amount` real NOT NULL,
	`date` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`receivable_id`) REFERENCES `receivables`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `receivables` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`debtor` text NOT NULL,
	`amount` real NOT NULL,
	`remaining` real NOT NULL,
	`currency` text DEFAULT 'MGA' NOT NULL,
	`due_date` integer,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `savings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`target_amount` real NOT NULL,
	`current_amount` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'MGA' NOT NULL,
	`target_date` integer,
	`goal_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`account_id` integer,
	`category_id` integer,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'MGA' NOT NULL,
	`frequency` text NOT NULL,
	`next_due_date` integer NOT NULL,
	`last_confirmed_date` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`to_account_id` integer,
	`category_id` integer,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'MGA' NOT NULL,
	`date` integer NOT NULL,
	`note` text,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `asset_depreciations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`asset_id` integer NOT NULL,
	`date` integer NOT NULL,
	`value` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`initial_value` real NOT NULL,
	`currency` text DEFAULT 'MGA' NOT NULL,
	`acquisition_date` integer NOT NULL,
	`depreciation_rate` real DEFAULT 0 NOT NULL,
	`depreciation_method` text DEFAULT 'none' NOT NULL,
	`useful_life_months` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`location` text,
	`note` text,
	`is_all_day` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goal_contributions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`goal_id` integer NOT NULL,
	`amount` real NOT NULL,
	`date` integer NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`domain` text NOT NULL,
	`target_amount` real,
	`current_amount` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'MGA' NOT NULL,
	`target_date` integer,
	`priority` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`budget_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `habit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`habit_id` integer NOT NULL,
	`date` integer NOT NULL,
	`is_done` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`cadence` text NOT NULL,
	`target_per_period` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subtasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`title` text NOT NULL,
	`is_done` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`project_id` integer,
	`goal_id` integer,
	`priority` text DEFAULT 'medium' NOT NULL,
	`due_date` integer,
	`is_recurring` integer DEFAULT false NOT NULL,
	`recurrence_rule` text,
	`estimated_minutes` integer,
	`status` text DEFAULT 'todo' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `time_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`category` text NOT NULL,
	`task_id` integer,
	`start_at` integer NOT NULL,
	`end_at` integer,
	`planned_minutes` integer,
	`actual_minutes` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `timeline_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`occurred_at` integer NOT NULL,
	`domain` text NOT NULL,
	`ref_type` text NOT NULL,
	`ref_id` integer,
	`title` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`muscle_group` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `foods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`calories_per_100g` real NOT NULL,
	`protein_per_100g` real DEFAULT 0 NOT NULL,
	`carbs_per_100g` real DEFAULT 0 NOT NULL,
	`fat_per_100g` real DEFAULT 0 NOT NULL,
	`fiber_per_100g` real DEFAULT 0,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meal_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meal_id` integer NOT NULL,
	`food_id` integer NOT NULL,
	`grams` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`type` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `water_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`amount_ml` real NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workout_sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workout_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`set_index` integer NOT NULL,
	`reps` integer NOT NULL,
	`weight` real,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`situation` text NOT NULL,
	`options_considered` text NOT NULL,
	`simulation_id` integer,
	`chosen_option` text NOT NULL,
	`reason` text,
	`expected_result` text,
	`actual_result` text,
	`decided_at` integer NOT NULL,
	`reviewed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`simulation_id`) REFERENCES `simulations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `insights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`domain` text NOT NULL,
	`severity` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`source` text NOT NULL,
	`method` text NOT NULL,
	`confidence` real,
	`data_ref` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ooda_cycles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`observe_summary` text,
	`orient_summary` text,
	`decision` text,
	`action` text,
	`result_summary` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `simulation_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`simulation_id` integer NOT NULL,
	`scenario_label` text NOT NULL,
	`finance_impact` text NOT NULL,
	`time_impact` text,
	`goals_impact` text,
	`life_score_impact` real,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`simulation_id`) REFERENCES `simulations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `simulations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`label` text NOT NULL,
	`input_params` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_knowledge_chunks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_type` text NOT NULL,
	`source_id` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_memory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`size_mb` integer,
	`is_installed` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`last_verified_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`summary` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` integer,
	`before` text,
	`after` text,
	`source` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `automation_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`trigger` text NOT NULL,
	`condition` text,
	`action` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `backup_metadata` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`backup_id` integer NOT NULL,
	`app_version` text NOT NULL,
	`db_version` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`backup_id`) REFERENCES `backups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `backups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_path` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`checksum` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`note_id` integer,
	`file_path` text NOT NULL,
	`mime_type` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`tags` text,
	`category` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`level` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`domain` text,
	`ref_type` text,
	`ref_id` integer,
	`is_read` integer DEFAULT false NOT NULL,
	`group_key` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ocr_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`document_id` integer,
	`raw_text` text,
	`detected_amount` real,
	`detected_category` text,
	`transaction_id` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `wishlist_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`price` real,
	`currency` text DEFAULT 'MGA' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`category` text,
	`planned_date` integer,
	`budget_available` real,
	`is_purchased` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
