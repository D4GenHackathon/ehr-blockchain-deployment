import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { hospitals, patientRecords } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";

type Params = { params: Promise<{ hospitalId: string }> };

/**
 * GET /api/sharing/hospitals/[hospitalId]/records
 *
 * Returns a minimal public view of another hospital's patient records
 * (name + patientCode only — no clinical details) so that a requesting
 * hospital can pick which records they want to request.
 *
 * Authentication required; caller must be from a DIFFERENT hospital than
 * the target.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { hospitalId } = await params;

  // Verify target hospital exists
  const [targetHospital] = await db
    .select({ id: hospitals.id, name: hospitals.name })
    .from(hospitals)
    .where(eq(hospitals.id, hospitalId))
    .limit(1);

  if (!targetHospital) {
    return NextResponse.json({ ok: false, error: "Hospital not found." }, { status: 404 });
  }

  // Return public-facing record index (no clinical details)
  const records = await db
    .select({
      id: patientRecords.id,
      patientCode: patientRecords.patientCode,
      fullName: patientRecords.fullName,
      // Only surface the condition name so B knows what they're requesting
      medicalCondition: patientRecords.medicalCondition,
    })
    .from(patientRecords)
    .where(eq(patientRecords.hospitalId, hospitalId))
    .orderBy(patientRecords.fullName)
    .limit(200);

  return NextResponse.json({
    ok: true,
    data: {
      hospitalName: targetHospital.name,
      records,
    },
  });
}
