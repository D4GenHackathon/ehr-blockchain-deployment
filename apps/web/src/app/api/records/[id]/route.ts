import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { activityLogs, patientRecords } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";
import {
  assertCanMutateRecord,
  complianceResponse,
  getComplianceContext,
  projectRecordForAccess,
} from "@/lib/compliance-policy";
import { updateRecordSchema } from "@/types/records";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  let ctx;
  try {
    ctx = await getComplianceContext(await requireAuthSession());
  } catch (error) {
    const response = complianceResponse(error);
    if (response) return response;
    throw error;
  }

  const { id } = await params;
  const [record] = await db
    .select()
    .from(patientRecords)
    .where(and(eq(patientRecords.id, id), eq(patientRecords.hospitalId, ctx.hospitalId)))
    .limit(1);

  if (!record) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Record not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data: projectRecordForAccess(record, ctx) });
}

export async function PUT(request: NextRequest, { params }: Params) {
  let ctx;
  try {
    ctx = await getComplianceContext(await requireAuthSession());
    assertCanMutateRecord(ctx, "update");
  } catch (error) {
    const response = complianceResponse(error);
    if (response) return response;
    throw error;
  }

  const parsedBody = updateRecordSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_INPUT", message: parsedBody.error.message } },
      { status: 400 }
    );
  }

  const payload = parsedBody.data;
  if (Object.keys(payload).length === 0) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_INPUT", message: "No fields to update." } },
      { status: 400 }
    );
  }

  const { id } = await params;
  const updateResult = await db
    .update(patientRecords)
    .set({ ...payload, updatedAt: Date.now() })
    .where(and(eq(patientRecords.id, id), eq(patientRecords.hospitalId, ctx.hospitalId)));

  if (updateResult.changes === 0) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Record not found." } },
      { status: 404 }
    );
  }

  const [record] = await db
    .select()
    .from(patientRecords)
    .where(and(eq(patientRecords.id, id), eq(patientRecords.hospitalId, ctx.hospitalId)))
    .limit(1);
  await db.insert(activityLogs).values({
    id: crypto.randomUUID(),
    hospitalId: ctx.hospitalId,
    actorUserId: ctx.userId,
    type: "record_updated",
    title: "Updated a patient record",
    relatedEntityType: "patient_record",
    relatedEntityId: id,
    metadata: JSON.stringify({ fields: Object.keys(payload), standard: "STANDARD.md" }),
    createdAt: Date.now(),
  });

  return NextResponse.json({ ok: true, data: record ? projectRecordForAccess(record, ctx) : null });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  let ctx;
  try {
    ctx = await getComplianceContext(await requireAuthSession());
    assertCanMutateRecord(ctx, "delete");
  } catch (error) {
    const response = complianceResponse(error);
    if (response) return response;
    throw error;
  }

  const { id } = await params;
  const deleteResult = await db
    .delete(patientRecords)
    .where(and(eq(patientRecords.id, id), eq(patientRecords.hospitalId, ctx.hospitalId)));

  if (deleteResult.changes === 0) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Record not found." } },
      { status: 404 }
    );
  }

  await db.insert(activityLogs).values({
    id: crypto.randomUUID(),
    hospitalId: ctx.hospitalId,
    actorUserId: ctx.userId,
    type: "record_deleted",
    title: "Deleted a patient record",
    relatedEntityType: "patient_record",
    relatedEntityId: id,
    metadata: JSON.stringify({ standard: "STANDARD.md" }),
    createdAt: Date.now(),
  });

  return NextResponse.json({ ok: true });
}
