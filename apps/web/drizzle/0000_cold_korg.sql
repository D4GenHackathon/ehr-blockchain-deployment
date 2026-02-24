CREATE TABLE `activity_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`hospital_id` text NOT NULL,
	`actor_user_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`related_entity_type` text NOT NULL,
	`related_entity_id` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `data_share_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`from_hospital_id` text NOT NULL,
	`to_hospital_id` text NOT NULL,
	`patient_record_ids` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`walrus_blob_id` text,
	`seal_policy_id` text,
	`sui_tx_digest` text,
	`purpose` text NOT NULL,
	`message` text,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`responded_at` integer,
	`shared_at` integer,
	FOREIGN KEY (`from_hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hospitals` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`sui_address` text NOT NULL,
	`logo_url` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hospitals_code_unique` ON `hospitals` (`code`);--> statement-breakpoint
CREATE TABLE `patient_records` (
	`id` text PRIMARY KEY NOT NULL,
	`hospital_id` text NOT NULL,
	`patient_code` text NOT NULL,
	`full_name` text NOT NULL,
	`age` integer NOT NULL,
	`gender` text NOT NULL,
	`blood_type` text NOT NULL,
	`medical_condition` text NOT NULL,
	`date_of_admission` integer NOT NULL,
	`doctor_name` text NOT NULL,
	`insurance_provider` text NOT NULL,
	`billing_amount` real NOT NULL,
	`room_number` text NOT NULL,
	`admission_type` text NOT NULL,
	`discharge_date` integer NOT NULL,
	`medication` text NOT NULL,
	`test_results` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`hospital_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `zkp_exchanges` (
	`id` text PRIMARY KEY NOT NULL,
	`requestor_hospital_id` text NOT NULL,
	`holder_hospital_id` text NOT NULL,
	`patient_record_id` text NOT NULL,
	`circuit_id` text NOT NULL,
	`request_type` text NOT NULL,
	`public_inputs` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`prover_job_id` text,
	`proof` text,
	`public_signals` text,
	`verification_result` integer,
	`message` text,
	`created_at` integer NOT NULL,
	`accepted_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`requestor_hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`holder_hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_record_id`) REFERENCES `patient_records`(`id`) ON UPDATE no action ON DELETE no action
);
