"use client";

import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from "@mysten/dapp-kit";
import { EncryptedObject, SealClient, SessionKey, type SealCompatibleClient } from "@mysten/seal";
import { fromHex } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import { useMemo } from "react";

import {
  SEAL_ALLOWLIST_PACKAGE_ID,
  SEAL_KEY_SERVER_OBJECT_ID,
  SEAL_AGGREGATOR_URL,
} from "@/lib/seal-config";

const SESSION_TTL_MIN = 10;

function buildSealClient(suiClient: SealCompatibleClient) {
  return new SealClient({
    suiClient,
    serverConfigs: [
      {
        objectId: SEAL_KEY_SERVER_OBJECT_ID,
        weight: 1,
        aggregatorUrl: SEAL_AGGREGATOR_URL,
      },
    ],
    verifyKeyServers: false,
  });
}

/**
 * Encrypt plaintext bytes bound to a Seal allowlist.
 * The key-id is hex(allowlistId bytes) + hex(16-byte random nonce).
 * packageId and id must be hex strings per the Seal SDK types.
 */
export function useSealEncrypt() {
  const suiClient = useSuiClient();
  const sealClient = useMemo(() => buildSealClient(suiClient as SealCompatibleClient), [suiClient]);

  async function encrypt(
    plaintext: Uint8Array,
    allowlistId: string
  ): Promise<{ encryptedBytes: Uint8Array; keyId: string }> {
    // key-id = allowlistId (32 bytes) as hex + 16-byte random nonce as hex
    const cleanAllowlistId = allowlistId.replace("0x", "").padStart(64, "0");
    const nonceBytes = new Uint8Array(16);
    crypto.getRandomValues(nonceBytes);
    const nonceHex = Array.from(nonceBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const keyIdHex = cleanAllowlistId + nonceHex;

    const { encryptedObject } = await sealClient.encrypt({
      threshold: 1,
      packageId: SEAL_ALLOWLIST_PACKAGE_ID,
      id: keyIdHex,
      data: plaintext,
    });

    return {
      encryptedBytes: encryptedObject,
      keyId: keyIdHex,
    };
  }

  return { encrypt };
}

/**
 * Decrypt Seal-encrypted bytes that were encrypted against an allowlist.
 * Requires the connected wallet to sign a SessionKey personal message.
 */
export function useSealDecrypt() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const sealClient = useMemo(() => buildSealClient(suiClient as SealCompatibleClient), [suiClient]);

  async function decrypt(
    encryptedBytes: Uint8Array,
    allowlistId: string
  ): Promise<Uint8Array> {
    if (!account) throw new Error("Wallet not connected");

    // 1. Create session key
    const sessionKey = await SessionKey.create({
      address: account.address,
      packageId: SEAL_ALLOWLIST_PACKAGE_ID,
      ttlMin: SESSION_TTL_MIN,
      suiClient: suiClient as SealCompatibleClient,
    });

    // 2. Sign the personal message with the connected wallet
    const { signature } = await signPersonalMessage({
      message: sessionKey.getPersonalMessage(),
    });
    await sessionKey.setPersonalMessageSignature(signature);

    // 3. Parse encrypted object to get the stored key-id (hex string)
    const encryptedObj = EncryptedObject.parse(encryptedBytes);
    const keyId = encryptedObj.id; // hex string

    // 4. Build PTB that calls seal_approve with the allowlist
    const tx = new Transaction();
    tx.moveCall({
      target: `${SEAL_ALLOWLIST_PACKAGE_ID}::allowlist::seal_approve`,
      arguments: [
        tx.pure.vector("u8", fromHex(keyId)),
        tx.object(allowlistId),
      ],
    });
    const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

    // 5. Decrypt
    const decrypted = await sealClient.decrypt({
      data: encryptedBytes,
      sessionKey,
      txBytes,
    });

    return decrypted;
  }

  return { decrypt };
}
