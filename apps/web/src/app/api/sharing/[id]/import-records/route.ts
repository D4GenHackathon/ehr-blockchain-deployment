import { and, eq, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { activityLogs, dataShareRequests, patientRecords } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const importBodySchema = z.object({
  records: z
    .array(
      z.object({
        patientCode: z.string(),
        fullName: z.string(),
        age: z.number().int().optional().default(0),
        gender: z.enum(["male", "female", "other"]).optional().default("other"),
        bloodType: z.string().optional().default("Unknown"),
        medicalCondition: z.string().optional().default("Unknown"),
        dateOfAdmission: z.number().optional().default(0),
        doctorName: z.string().optional().default("Unknown"),
        insuranceProvider: z.string().optional().default("Unknown"),
        billingAmount: z.number().optional().default(0),
        roomNumber: z.string().optional().default("N/A"),
        admissionType: z.string().optional().default("Unknown"),
        dischargeDate: z.number().optional().default(0),
        medication: z.string().optional().default("None"),
        testResults: z.string().optional().default("None"),
        status: z.enum(["active", "discharged", "transferred"]).optional().default("discharged"),
      })
    )
    .min(1)
    .max(50),
});

/**
 * POST /api/sharing/[id]/import-records
 *
 * After Hospital B successfully decrypts a share request, they can call this
 * endpoint to import the decrypted patient records into their own database.
 * The share request must belong to the calling hospital (fromHospitalId).
 */
export async function POST(request: NextRequest, { params }: Params) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const hospitalId = session.hospitalId!;
  const { id } = await params;

  // Verify the share request belongs to this hospital as the requester
  const [req] = await db
    .select()
    .from(dataShareRequests)
    .where(
      and(
        eq(dataShareRequests.id, id),
        or(
          eq(dataShareRequests.fromHospitalId, hospitalId),
          eq(dataShareRequests.toHospitalId, hospitalId)
        )!
      )
    )
    .limit(1);

  if (!req) {
    return NextResponse.json({ ok: false, error: "Share request not found." }, { status: 404 });
  }

  // Only the requesting hospital (B) imports records
  if (req.fromHospitalId !== hospitalId) {
    return NextResponse.json(
      { ok: false, error: "Only the requesting hospital can import records." },
      { status: 403 }
    );
  }

  // Must be in a state where decryption has happened
  if (!["opened", "confirmed", "completed"].includes(req.status)) {
    return NextResponse.json(
      { ok: false, error: "Records can only be imported after the share has been opened." },
      { status: 400 }
    );
  }

  const parsed = importBodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.message },
      { status: 400 }
    );
  }

  const now = Date.now();
  const inserted: string[] = [];

  for (const rec of parsed.data.records) {
    const newId = crypto.randomUUID();
    // Prefix patient code to indicate imported source
    const importedCode = `IMP-${rec.patientCode}`;
    await db.insert(patientRecords).values({
      id: newId,
      hospitalId,
      patientCode: importedCode,
      fullName: rec.fullName,
      age: rec.age,
      gender: rec.gender,
      bloodType: rec.bloodType,
      medicalCondition: rec.medicalCondition,
      dateOfAdmission: rec.dateOfAdmission || now,
      doctorName: rec.doctorName,
      insuranceProvider: rec.insuranceProvider,
      billingAmount: rec.billingAmount,
      roomNumber: rec.roomNumber,
      admissionType: rec.admissionType,
      dischargeDate: rec.dischargeDate || now,
      medication: rec.medication,
      testResults: rec.testResults,
      status: rec.status,
      createdAt: now,
      updatedAt: now,
    });
    inserted.push(newId);
  }

  // Log the activity
  await db.insert(activityLogs).values({
    id: crypto.randomUUID(),
    hospitalId,
    actorUserId: session.userId,
    type: "record_imported",
    title: `Imported ${inserted.length} record(s) from shared data`,
    relatedEntityType: "data_share_request",
    relatedEntityId: id,
    metadata: JSON.stringify({ shareRequestId: id, importedCount: inserted.length }),
    createdAt: now,
  });

  return NextResponse.json({
    ok: true,
    data: { importedCount: inserted.length, recordIds: inserted },
  });
}
