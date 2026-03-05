import { and, asc, count, desc, eq, like, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { patientRecords } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";
import { createRecordSchema, listRecordsQuerySchema } from "@/types/records";

export async function GET(request: NextRequest) {
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
      { ok: false, error: { code: "FORBIDDEN", message: "Hospital context is required." } },
      { status: 403 }
    );
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

  const filters = [eq(patientRecords.hospitalId, hospitalId)];
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
      items: records,
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
      { ok: false, error: { code: "FORBIDDEN", message: "Hospital context is required." } },
      { status: 403 }
    );
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
  await db.insert(patientRecords).values({
    id,
    hospitalId,
    ...parsedBody.data,
    createdAt: now,
    updatedAt: now,
  });

  const [record] = await db.select().from(patientRecords).where(eq(patientRecords.id, id)).limit(1);
  return NextResponse.json({ ok: true, data: record }, { status: 201 });
}
