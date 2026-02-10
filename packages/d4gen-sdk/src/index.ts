export type D4GenNetwork = "testnet" | "mainnet" | "localnet";

export interface D4GenSdkConfig {
  network: D4GenNetwork;
}

export class D4GenSdk {
  constructor(private readonly config: D4GenSdkConfig) {}

  getNetwork(): D4GenNetwork {
    return this.config.network;
  }
}
