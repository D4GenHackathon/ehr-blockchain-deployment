import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { activityLogs, patientRecords } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";
import { complianceResponse, getComplianceContext, projectRecordsForAccess } from "@/lib/compliance-policy";

const querySchema = z.object({
  format: z.enum(["json", "csv"]).default("json"),
});

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: Record<string, unknown>[]) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
}

export async function GET(request: NextRequest) {
  let ctx;
  try {
    ctx = await getComplianceContext(await requireAuthSession());
  } catch (error) {
    const response = complianceResponse(error);
    if (response) return response;
    throw error;
  }

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_QUERY", message: parsed.error.message } },
      { status: 400 },
    );
  }

  const records = await db
    .select()
    .from(patientRecords)
    .where(eq(patientRecords.hospitalId, ctx.hospitalId));
  const projected = projectRecordsForAccess(records, ctx);

  await db.insert(activityLogs).values({
    id: crypto.randomUUID(),
    hospitalId: ctx.hospitalId,
    actorUserId: ctx.userId,
    type: "records_exported",
    title: "Exported patient records",
    relatedEntityType: "patient_records",
    relatedEntityId: ctx.hospitalId,
    metadata: JSON.stringify({
      format: parsed.data.format,
      recordCount: projected.length,
      organizationType: ctx.organizationType,
      standard: "STANDARD.md",
    }),
    createdAt: Date.now(),
  });

  if (parsed.data.format === "csv") {
    return new NextResponse(toCsv(projected), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="d4gen-records-${ctx.hospitalId}.csv"`,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    data: {
      exportedAt: new Date().toISOString(),
      organizationType: ctx.organizationType,
      items: projected,
    },
  });
}
