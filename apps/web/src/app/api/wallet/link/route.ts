import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { verifyPersonalMessageSignature } from "@mysten/sui/verify";

import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isValidSuiAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(address);
}

// POST /api/wallet/link  — verify signature and save wallet mapping
export async function POST(request: NextRequest) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as { address?: string; signature?: string };
  const address = body.address?.toLowerCase();
  const { signature } = body;

  if (!address || !isValidSuiAddress(address)) {
    return NextResponse.json(
      { ok: false, error: "INVALID_ADDRESS", message: "Invalid Sui address format." },
      { status: 400 }
    );
  }
  if (!signature || typeof signature !== "string") {
    return NextResponse.json(
      { ok: false, error: "MISSING_SIGNATURE", message: "Signature is required." },
      { status: 400 }
    );
  }

  // Load current user's pending nonce
  const [user] = await db
    .select({ walletNonce: users.walletNonce, walletNonceAt: users.walletNonceAt })
    .from(users)
    .where(eq(users.id, session.userId!))
    .limit(1);

  if (!user?.walletNonce || !user?.walletNonceAt) {
    return NextResponse.json(
      { ok: false, error: "NO_NONCE", message: "No pending nonce found. Please request a new nonce." },
      { status: 400 }
    );
  }

  if (Date.now() - user.walletNonceAt > NONCE_TTL_MS) {
    await db
      .update(users)
      .set({ walletNonce: null, walletNonceAt: null })
      .where(eq(users.id, session.userId!));
    return NextResponse.json(
      { ok: false, error: "NONCE_EXPIRED", message: "Nonce expired. Please try again." },
      { status: 400 }
    );
  }

  // Reconstruct the exact message that was signed
  const message = `Link wallet to EHR Dashboard\nNonce: ${user.walletNonce}\nAddress: ${address}`;
  const messageBytes = new TextEncoder().encode(message);

  // Verify signature
  let signerAddress: string;
  try {
    const publicKey = await verifyPersonalMessageSignature(messageBytes, signature);
    signerAddress = publicKey.toSuiAddress();
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_SIGNATURE", message: "Signature verification failed." },
      { status: 400 }
    );
  }

  if (signerAddress !== address) {
    return NextResponse.json(
      { ok: false, error: "SIGNATURE_MISMATCH", message: "Signature does not match the provided address." },
      { status: 400 }
    );
  }

  // Double-check address isn't taken by another user
  const [existingOwner] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.suiAddress, address))
    .limit(1);

  if (existingOwner && existingOwner.id !== session.userId) {
    return NextResponse.json(
      { ok: false, error: "ADDRESS_TAKEN", message: "This wallet address is already linked to another account." },
      { status: 409 }
    );
  }

  const now = Date.now();
  await db
    .update(users)
    .set({
      suiAddress: address,
      walletLinkedAt: now,
      walletNonce: null,
      walletNonceAt: null,
    })
    .where(eq(users.id, session.userId!));

  return NextResponse.json({ ok: true, address, linkedAt: now });
}

// DELETE /api/wallet/link — unlink wallet
export async function DELETE(_request: NextRequest) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  await db
    .update(users)
    .set({ suiAddress: null, walletLinkedAt: null, walletNonce: null, walletNonceAt: null })
    .where(eq(users.id, session.userId!));

  return NextResponse.json({ ok: true });
}
