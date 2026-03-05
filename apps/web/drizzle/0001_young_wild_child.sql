ALTER TABLE `data_share_requests` ADD `request_mailbox_id` text;--> statement-breakpoint
ALTER TABLE `data_share_requests` ADD `request_public_key` text;--> statement-breakpoint
ALTER TABLE `data_share_requests` ADD `blob_size` integer;--> statement-breakpoint
ALTER TABLE `data_share_requests` ADD `storage_nodes` text;--> statement-breakpoint
ALTER TABLE `data_share_requests` ADD `ready_at` integer;--> statement-breakpoint
ALTER TABLE `data_share_requests` ADD `opened_at` integer;--> statement-breakpoint
ALTER TABLE `data_share_requests` ADD `confirmed_at` integer;--> statement-breakpoint
ALTER TABLE `zkp_exchanges` ADD `job_status` text;--> statement-breakpoint
ALTER TABLE `zkp_exchanges` ADD `result_label` text;--> statement-breakpoint
ALTER TABLE `zkp_exchanges` ADD `vkey_id` text;--> statement-breakpoint
ALTER TABLE `zkp_exchanges` ADD `verify_tx_digest` text;--> statement-breakpoint
ALTER TABLE `zkp_exchanges` ADD `verifying_at` integer;--> statement-breakpoint
ALTER TABLE `zkp_exchanges` ADD `verified_at` integer;