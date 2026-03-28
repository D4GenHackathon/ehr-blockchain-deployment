"use client";

import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { SEAL_ALLOWLIST_PACKAGE_ID } from "@/lib/seal-config";

export interface AllowlistResult {
  allowlistId: string;
  capId: string;
  txDigest: string;
}

/**
 * Returns helpers to create an on-chain Seal allowlist and add/remove members.
 * All transactions are signed by the connected wallet.
 */
export function useAllowlistOps() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: { showEffects: true, showObjectChanges: true },
      }),
  });

  /**
   * Create a new Allowlist shared object + return the Cap (owned by caller).
   * Returns { allowlistId, capId, txDigest }.
   */
  async function createAllowlist(name: string): Promise<AllowlistResult> {
    if (!account) throw new Error("Wallet not connected");

    const tx = new Transaction();
    tx.moveCall({
      target: `${SEAL_ALLOWLIST_PACKAGE_ID}::allowlist::create_allowlist_entry`,
      arguments: [tx.pure.string(name)],
    });
    tx.setGasBudget(50_000_000);

    const result = await signAndExecute({ transaction: tx });

    if (!result.effects) throw new Error("No transaction effects returned");
    if (result.effects.status?.status !== "success") {
      throw new Error(`Create allowlist tx failed: ${result.effects.status?.error ?? "unknown"}`);
    }

    // Find the shared Allowlist object and the owned Cap from objectChanges
    const changes = result.objectChanges ?? [];
    let allowlistId = "";
    let capId = "";

    for (const change of changes) {
      if (change.type === "created") {
        const objType = change.objectType ?? "";
        if (objType.includes("::allowlist::Allowlist")) {
          allowlistId = change.objectId;
        } else if (objType.includes("::allowlist::Cap")) {
          capId = change.objectId;
        }
      }
    }

    if (!allowlistId || !capId) {
      throw new Error(
        `Could not find Allowlist/Cap in tx changes. Changes: ${JSON.stringify(changes)}`
      );
    }

    return { allowlistId, capId, txDigest: result.digest };
  }

  /**
   * Add an address to an existing allowlist.
   * Hospital A calls this to grant Hospital B access.
   */
  async function addToAllowlist(
    allowlistId: string,
    capId: string,
    addressToAdd: string
  ): Promise<{ txDigest: string }> {
    if (!account) throw new Error("Wallet not connected");

    const tx = new Transaction();
    tx.moveCall({
      target: `${SEAL_ALLOWLIST_PACKAGE_ID}::allowlist::add`,
      arguments: [
        tx.object(allowlistId),
        tx.object(capId),
        tx.pure.address(addressToAdd),
      ],
    });
    tx.setGasBudget(50_000_000);

    const result = await signAndExecute({ transaction: tx });
    if (result.effects?.status?.status !== "success") {
      throw new Error(`Add to allowlist tx failed: ${result.effects?.status?.error ?? "unknown"}`);
    }
    return { txDigest: result.digest };
  }

  return { createAllowlist, addToAllowlist };
}
