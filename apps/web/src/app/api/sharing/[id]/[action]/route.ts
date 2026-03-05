import { and, eq, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { activityLogs, dataShareRequests } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";
import { shareActionSchema } from "@/types/sharing";

type Params = { params: Promise<{ id: string; action: string }> };

function resolveAction(input: string) {
  if (input === "approve") return "prepare-approve";
  if (input === "complete") return "mark-completed";
  return input;
}

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

  const { id, action: rawAction } = await params;
  const action = resolveAction(rawAction);
  if (!["prepare-approve", "reject", "open-record", "confirm-received", "mark-completed"].includes(action)) {
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
        action === "open-record" || action === "confirm-received"
          ? eq(dataShareRequests.fromHospitalId, hospitalId)
          : action === "mark-completed"
            ? or(
                eq(dataShareRequests.fromHospitalId, hospitalId),
                eq(dataShareRequests.toHospitalId, hospitalId)
              )!
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
  if (action === "prepare-approve") {
    if (!["pending", "preparing"].includes(existing.status)) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "INVALID_STATE", message: "Only pending requests can be prepared and approved." },
        },
        { status: 400 }
      );
    }
    const walrusBlobId = payload.walrusBlobId ?? `walrus_${id.slice(0, 8)}`;
    const sealPolicyId = payload.sealPolicyId ?? `seal_${id.slice(0, 8)}`;
    const suiTxDigest = payload.suiTxDigest ?? `sui_${Date.now()}`;
    const blobSize = payload.blobSize ?? 15 * 1024 * 1024;
    const storageNodes = payload.storageNodes ?? ["Node_1", "Node_5"];

    await db
      .update(dataShareRequests)
      .set({
        status: "ready_to_decrypt",
        respondedAt: now,
        readyAt: now,
        walrusBlobId,
        sealPolicyId,
        suiTxDigest,
        blobSize,
        storageNodes: JSON.stringify(storageNodes),
        message: payload.message ?? existing.message ?? null,
      })
      .where(eq(dataShareRequests.id, id));
  } else if (action === "reject") {
    if (!["pending", "preparing"].includes(existing.status)) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_STATE", message: "Only pending requests can be rejected." } },
        { status: 400 }
      );
    }
    await db
      .update(dataShareRequests)
      .set({ status: "rejected", respondedAt: now, message: payload.message ?? existing.message ?? null })
      .where(eq(dataShareRequests.id, id));
  } else if (action === "open-record") {
    if (!["ready_to_decrypt", "approved", "opened"].includes(existing.status)) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "INVALID_STATE", message: "Record must be ready to decrypt first." },
        },
        { status: 400 }
      );
    }
    await db
      .update(dataShareRequests)
      .set({
        status: "opened",
        openedAt: now,
        message: payload.message ?? existing.message ?? null,
      })
      .where(eq(dataShareRequests.id, id));
  } else if (action === "confirm-received") {
    if (!["opened", "confirmed"].includes(existing.status)) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_STATE", message: "Record must be opened before confirming." } },
        { status: 400 }
      );
    }
    await db
      .update(dataShareRequests)
      .set({
        status: "confirmed",
        confirmedAt: now,
        message: payload.message ?? existing.message ?? null,
      })
      .where(eq(dataShareRequests.id, id));
  } else {
    if (!["confirmed", "opened"].includes(existing.status)) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "INVALID_STATE", message: "Request must be opened/confirmed before completion." },
        },
        { status: 400 }
      );
    }
    await db
      .update(dataShareRequests)
      .set({
        status: "completed",
        sharedAt: now,
        confirmedAt: existing.confirmedAt ?? now,
        openedAt: existing.openedAt ?? now,
        readyAt: existing.readyAt ?? existing.respondedAt ?? now,
        walrusBlobId: payload.walrusBlobId ?? existing.walrusBlobId ?? null,
        blobSize: payload.blobSize ?? existing.blobSize ?? null,
        storageNodes: payload.storageNodes
          ? JSON.stringify(payload.storageNodes)
          : existing.storageNodes ?? null,
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
      actorUserId: ["open-record", "confirm-received", "mark-completed"].includes(action)
        ? session.userId
        : null,
      type: `sharing_request_${action}`,
      title:
        action === "prepare-approve"
          ? "Your sharing request is ready to decrypt"
          : action === "reject"
            ? "Your sharing request was rejected"
            : action === "open-record"
              ? "You opened the shared medical record"
              : action === "confirm-received"
                ? "You confirmed shared record receipt"
                : "Sharing request completed",
      relatedEntityType: "sharing",
      relatedEntityId: existing.id,
      metadata: JSON.stringify({
        step: action,
        message: payload.message ?? null,
        blobId: existing.walrusBlobId ?? null,
        sealId: existing.sealPolicyId ?? null,
      }),
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      hospitalId: existing.toHospitalId,
      actorUserId: ["prepare-approve", "reject", "mark-completed"].includes(action)
        ? session.userId
        : null,
      type: `sharing_request_${action}`,
      title:
        action === "prepare-approve"
          ? "Prepared and approved incoming sharing request"
          : action === "reject"
            ? "Rejected an incoming sharing request"
            : action === "open-record"
              ? "Requestor opened prepared data package"
              : action === "confirm-received"
                ? "Requestor confirmed received record"
                : "Sharing request completed",
      relatedEntityType: "sharing",
      relatedEntityId: existing.id,
      metadata: JSON.stringify({
        step: action,
        message: payload.message ?? null,
        blobId: existing.walrusBlobId ?? null,
        sealId: existing.sealPolicyId ?? null,
      }),
      createdAt: now,
    },
  ]);

  return NextResponse.json({ ok: true });
}
