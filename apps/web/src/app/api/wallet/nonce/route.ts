import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";

function isValidSuiAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(address);
}

export async function POST(request: NextRequest) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as { address?: string };
  const address = body.address?.toLowerCase();

  if (!address || !isValidSuiAddress(address)) {
    return NextResponse.json(
      { ok: false, error: "INVALID_ADDRESS", message: "Invalid Sui address format." },
      { status: 400 }
    );
  }

  // Check if this address is already linked to a DIFFERENT user
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

  const nonce = crypto.randomUUID();
  const now = Date.now();

  await db
    .update(users)
    .set({ walletNonce: nonce, walletNonceAt: now })
    .where(eq(users.id, session.userId!));

  const message = `Link wallet to EHR Dashboard\nNonce: ${nonce}\nAddress: ${address}`;

  return NextResponse.json({ ok: true, message, nonce });
}
