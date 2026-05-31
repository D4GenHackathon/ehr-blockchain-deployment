import { and, asc, count, desc, eq, like, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { activityLogs, patientRecords } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";
import {
  assertCanCreateRecord,
  complianceResponse,
  countRecordsForHospital,
  getComplianceContext,
  projectRecordsForAccess,
} from "@/lib/compliance-policy";
import { createRecordSchema, listRecordsQuerySchema } from "@/types/records";

export async function GET(request: NextRequest) {
  let ctx;
  try {
    ctx = await getComplianceContext(await requireAuthSession());
  } catch (error) {
    const response = complianceResponse(error);
    if (response) return response;
    throw error;
  }

  const parsedQuery = listRecordsQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );
  if (!parsedQuery.success) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_QUERY", message: parsedQuery.error.message } },
      { status: 400 }
    );
  }

  const { page, pageSize, q, medicalCondition, status, admissionType } = parsedQuery.data;
  const offset = (page - 1) * pageSize;

  const filters = [eq(patientRecords.hospitalId, ctx.hospitalId)];
  if (q) {
    filters.push(
      or(
        like(patientRecords.patientCode, `%${q}%`),
        like(patientRecords.fullName, `%${q}%`),
        like(patientRecords.doctorName, `%${q}%`)
      )!
    );
  }
  if (medicalCondition) filters.push(eq(patientRecords.medicalCondition, medicalCondition));
  if (status) filters.push(eq(patientRecords.status, status));
  if (admissionType) filters.push(eq(patientRecords.admissionType, admissionType));

  const whereClause = and(...filters);
  const records = await db
    .select()
    .from(patientRecords)
    .where(whereClause)
    .orderBy(desc(patientRecords.createdAt), asc(patientRecords.id))
    .limit(pageSize)
    .offset(offset);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(patientRecords)
    .where(whereClause);

  return NextResponse.json({
    ok: true,
    data: {
      items: projectRecordsForAccess(records, ctx),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    },
  });
}

export async function POST(request: NextRequest) {
  let ctx;
  try {
    ctx = await getComplianceContext(await requireAuthSession());
  } catch (error) {
    const response = complianceResponse(error);
    if (response) return response;
    throw error;
  }

  const parsedBody = createRecordSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_INPUT", message: parsedBody.error.message } },
      { status: 400 }
    );
  }

  const now = Date.now();
  const id = crypto.randomUUID();
  try {
    const recordInput = {
      ...parsedBody.data,
      dataLevel:
        ctx.organizationType === "commercial_biotech"
          ? "non_ehr"
          : ctx.organizationType === "clinical_research" && parsedBody.data.dataLevel === "full_ehr"
            ? "selected_attributes"
            : parsedBody.data.dataLevel,
      isSensitive: ctx.organizationType === "commercial_biotech" ? false : parsedBody.data.isSensitive,
    };
    const existingCount = await countRecordsForHospital(ctx.hospitalId);
    assertCanCreateRecord(ctx, existingCount, recordInput.dataLevel);
    await db.insert(patientRecords).values({
      id,
      hospitalId: ctx.hospitalId,
      ...recordInput,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(activityLogs).values({
      id: crypto.randomUUID(),
      hospitalId: ctx.hospitalId,
      actorUserId: ctx.userId,
      type: "record_created",
      title: "Created a patient record",
      relatedEntityType: "patient_record",
      relatedEntityId: id,
      metadata: JSON.stringify({ dataLevel: recordInput.dataLevel, standard: "STANDARD.md" }),
      createdAt: now,
    });
  } catch (error) {
    const response = complianceResponse(error);
    if (response) return response;
    throw error;
  }

  const [record] = await db.select().from(patientRecords).where(eq(patientRecords.id, id)).limit(1);
  return NextResponse.json({ ok: true, data: record ? projectRecordsForAccess([record], ctx)[0] : null }, { status: 201 });
}
