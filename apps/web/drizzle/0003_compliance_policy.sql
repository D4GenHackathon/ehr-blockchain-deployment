ALTER TABLE `hospitals` ADD `organization_type` text DEFAULT 'healthcare_provider' NOT NULL;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `data_level` text DEFAULT 'full_ehr' NOT NULL;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `source_type` text DEFAULT 'native' NOT NULL;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `is_sensitive` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `record_commitment` text;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `demographic_hash` text;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `zk_profile` text;
