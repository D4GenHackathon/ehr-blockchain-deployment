ALTER TABLE `users` ADD `sui_address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `wallet_linked_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `wallet_nonce` text;--> statement-breakpoint
ALTER TABLE `users` ADD `wallet_nonce_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `users_sui_address_unique` ON `users` (`sui_address`);