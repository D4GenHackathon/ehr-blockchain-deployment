import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { activityLogs, dataShareRequests } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";
import { shareActionSchema } from "@/types/sharing";

type Params = { params: Promise<{ id: string; action: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Not authenticated." } },
      { status: 401 }
    );
  }
  const hospitalId = session.hospitalId;
  if (!hospitalId) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid session." } },
      { status: 401 }
    );
  }

  const parsedBody = shareActionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsedBody.success) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_INPUT", message: parsedBody.error.message } },
      { status: 400 }
    );
  }

  const { id, action } = await params;
  if (!["approve", "reject", "complete"].includes(action)) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_ACTION", message: "Action is not supported." } },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select()
    .from(dataShareRequests)
    .where(
      and(
        eq(dataShareRequests.id, id),
        action === "complete"
          ? eq(dataShareRequests.fromHospitalId, hospitalId)
          : eq(dataShareRequests.toHospitalId, hospitalId)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Share request not found." } },
      { status: 404 }
    );
  }

  const now = Date.now();
  const payload = parsedBody.data;
  if (action === "approve") {
    if (existing.status !== "pending") {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_STATE", message: "Only pending requests can be approved." } },
        { status: 400 }
      );
    }
    await db
      .update(dataShareRequests)
      .set({ status: "approved", respondedAt: now, message: payload.message ?? existing.message ?? null })
      .where(eq(dataShareRequests.id, id));
  } else if (action === "reject") {
    if (existing.status !== "pending") {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_STATE", message: "Only pending requests can be rejected." } },
        { status: 400 }
      );
    }
    await db
      .update(dataShareRequests)
      .set({ status: "rejected", respondedAt: now, message: payload.message ?? existing.message ?? null })
      .where(eq(dataShareRequests.id, id));
  } else {
    if (existing.status !== "approved") {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_STATE", message: "Only approved requests can be completed." } },
        { status: 400 }
      );
    }
    await db
      .update(dataShareRequests)
      .set({
        status: "shared",
        sharedAt: now,
        walrusBlobId: payload.walrusBlobId ?? existing.walrusBlobId ?? null,
        sealPolicyId: payload.sealPolicyId ?? existing.sealPolicyId ?? null,
        suiTxDigest: payload.suiTxDigest ?? existing.suiTxDigest ?? null,
        message: payload.message ?? existing.message ?? null,
      })
      .where(eq(dataShareRequests.id, id));
  }

  await db.insert(activityLogs).values([
    {
      id: crypto.randomUUID(),
      hospitalId: existing.fromHospitalId,
      actorUserId: action === "complete" ? session.userId : null,
      type: `sharing_request_${action}`,
      title:
        action === "approve"
          ? "Your sharing request was approved"
          : action === "reject"
            ? "Your sharing request was rejected"
            : "Shared data package was completed",
      relatedEntityType: "sharing",
      relatedEntityId: existing.id,
      metadata: payload.message ? JSON.stringify({ message: payload.message }) : null,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      hospitalId: existing.toHospitalId,
      actorUserId: action === "complete" ? null : session.userId,
      type: `sharing_request_${action}`,
      title:
        action === "approve"
          ? "Approved an incoming sharing request"
          : action === "reject"
            ? "Rejected an incoming sharing request"
            : "Incoming data package marked as shared",
      relatedEntityType: "sharing",
      relatedEntityId: existing.id,
      metadata: payload.message ? JSON.stringify({ message: payload.message }) : null,
      createdAt: now,
    },
  ]);

  return NextResponse.json({ ok: true });
}
