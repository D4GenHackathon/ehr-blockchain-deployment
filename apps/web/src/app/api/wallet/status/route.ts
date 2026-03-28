import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";

export async function GET() {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const [user] = await db
    .select({ suiAddress: users.suiAddress, walletLinkedAt: users.walletLinkedAt })
    .from(users)
    .where(eq(users.id, session.userId!))
    .limit(1);

  if (!user) {
    return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    linked: !!user.suiAddress,
    address: user.suiAddress ?? null,
    linkedAt: user.walletLinkedAt ?? null,
  });
}
