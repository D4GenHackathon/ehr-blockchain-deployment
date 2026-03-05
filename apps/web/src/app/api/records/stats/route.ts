import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { patientRecords } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";

export async function GET() {
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

  const whereHospital = eq(patientRecords.hospitalId, hospitalId);

  const [totals] = await db
    .select({
      totalRecords: sql<number>`count(*)`,
      activeRecords: sql<number>`sum(case when ${patientRecords.status} = 'active' then 1 else 0 end)`,
      dischargedRecords: sql<number>`sum(case when ${patientRecords.status} = 'discharged' then 1 else 0 end)`,
    })
    .from(patientRecords)
    .where(whereHospital);

  const byCondition = await db
    .select({
      medicalCondition: patientRecords.medicalCondition,
      total: sql<number>`count(*)`,
    })
    .from(patientRecords)
    .where(whereHospital)
    .groupBy(patientRecords.medicalCondition);

  const latestAdmission = await db
    .select()
    .from(patientRecords)
    .where(and(whereHospital))
    .orderBy(sql`${patientRecords.dateOfAdmission} desc`)
    .limit(1);

  return NextResponse.json({
    ok: true,
    data: {
      totalRecords: totals?.totalRecords ?? 0,
      activeRecords: totals?.activeRecords ?? 0,
      dischargedRecords: totals?.dischargedRecords ?? 0,
      byCondition,
      latestAdmission: latestAdmission[0] ?? null,
    },
  });
}
