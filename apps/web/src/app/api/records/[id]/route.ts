import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { patientRecords } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";
import { updateRecordSchema } from "@/types/records";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Not authenticated." } },
      { status: 401 }
    );
  }

  const { id } = await params;
  const [record] = await db
    .select()
    .from(patientRecords)
    .where(and(eq(patientRecords.id, id), eq(patientRecords.hospitalId, session.hospitalId)))
    .limit(1);

  if (!record) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Record not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data: record });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Not authenticated." } },
      { status: 401 }
    );
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
    .where(and(eq(patientRecords.id, id), eq(patientRecords.hospitalId, session.hospitalId)));

  if (updateResult.changes === 0) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Record not found." } },
      { status: 404 }
    );
  }

  const [record] = await db
    .select()
    .from(patientRecords)
    .where(and(eq(patientRecords.id, id), eq(patientRecords.hospitalId, session.hospitalId)))
    .limit(1);

  return NextResponse.json({ ok: true, data: record });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Not authenticated." } },
      { status: 401 }
    );
  }

  const { id } = await params;
  const deleteResult = await db
    .delete(patientRecords)
    .where(and(eq(patientRecords.id, id), eq(patientRecords.hospitalId, session.hospitalId)));

  if (deleteResult.changes === 0) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Record not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
