// Seal + Walrus testnet configuration
// Allowlist package deployed by MystenLabs on testnet (examples/move/sources/allowlist.move)
export const SEAL_ALLOWLIST_PACKAGE_ID =
  process.env.NEXT_PUBLIC_SEAL_PACKAGE_ID ??
  "0xc5ce2742cac46421b62028557f1d7aea8a4c50f651379a79afdf12cd88628807";

// Decentralized Seal key server (testnet)
// https://seal-docs.wal.app/Pricing#verified-decentralized-key-servers
export const SEAL_KEY_SERVER_OBJECT_ID =
  process.env.NEXT_PUBLIC_SEAL_KEY_SERVER_OBJECT_ID ??
  "0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98";

export const SEAL_AGGREGATOR_URL =
  "https://seal-aggregator-testnet.mystenlabs.com";

// Walrus testnet endpoints (free on testnet)
export const WALRUS_PUBLISHER_URL =
  process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL ??
  "https://publisher.walrus-testnet.walrus.space";

export const WALRUS_AGGREGATOR_URL =
  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ??
  "https://aggregator.walrus-testnet.walrus.space";

// Default storage duration (epochs). 1 epoch ≈ 1 day on testnet.
export const WALRUS_DEFAULT_EPOCHS = 1;
