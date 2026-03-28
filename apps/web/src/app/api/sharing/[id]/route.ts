import { and, eq, inArray, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import {
  dataShareRequests,
  hospitals,
  patientRecords,
  users,
} from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/sharing/[id]
 * Returns a single share request visible to the current hospital,
 * enriched with:
 *  - fromHospital / toHospital names
 *  - patient record details
 *  - recipientSuiAddress: the linked Sui wallet of any admin at the
 *    *requesting* hospital (Hospital B) – needed by Hospital A to add them
 *    to the Seal allowlist
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const hospitalId = session.hospitalId!;
  const { id } = await params;

  // Load share request visible to the current hospital (either side)
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
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  // Load hospital details
  const hospitalIds = Array.from(new Set([req.fromHospitalId, req.toHospitalId]));
  const hospitalRows = await db
    .select({ id: hospitals.id, name: hospitals.name, code: hospitals.code })
    .from(hospitals)
    .where(eq(hospitals.id, hospitalIds[0]));

  // Build a map for lookup
  const hospitalMap: Record<string, { name: string; code: string }> = {};
  for (const h of await db
    .select({ id: hospitals.id, name: hospitals.name, code: hospitals.code })
    .from(hospitals)) {
    hospitalMap[h.id] = { name: h.name, code: h.code };
  }

  // Load patient records from the *holder* hospital (toHospitalId = Hospital A)
  // These are the records that Hospital A will encrypt and share.
  const recordIds: string[] = (() => {
    try { return JSON.parse(req.patientRecordIds) as string[]; } catch { return []; }
  })();
  const records = recordIds.length
    ? await db
        .select({
          id: patientRecords.id,
          patientCode: patientRecords.patientCode,
          fullName: patientRecords.fullName,
          age: patientRecords.age,
          gender: patientRecords.gender,
          bloodType: patientRecords.bloodType,
          medicalCondition: patientRecords.medicalCondition,
          dateOfAdmission: patientRecords.dateOfAdmission,
          doctorName: patientRecords.doctorName,
          insuranceProvider: patientRecords.insuranceProvider,
          billingAmount: patientRecords.billingAmount,
          roomNumber: patientRecords.roomNumber,
          admissionType: patientRecords.admissionType,
          dischargeDate: patientRecords.dischargeDate,
          medication: patientRecords.medication,
          testResults: patientRecords.testResults,
          status: patientRecords.status,
        })
        .from(patientRecords)
        // Fetch from toHospitalId (A) and only the requested IDs
        .where(
          and(
            eq(patientRecords.hospitalId, req.toHospitalId),
            inArray(patientRecords.id, recordIds)
          )
        )
    : [];

  // Find the linked Sui address of an admin at the *requesting* hospital (Hospital B = fromHospitalId)
  // This is needed by Hospital A (toHospitalId) to add B to the Seal allowlist
  const [recipientUser] = await db
    .select({ suiAddress: users.suiAddress })
    .from(users)
    .where(
      and(
        eq(users.hospitalId, req.fromHospitalId),
        // prefer admin users; any user with a linked wallet works
      )
    )
    .limit(1);

  const recipientSuiAddress = recipientUser?.suiAddress ?? null;

  // Parse storage nodes
  let storageNodes: string[] = [];
  try {
    if (req.storageNodes) storageNodes = JSON.parse(req.storageNodes) as string[];
  } catch { /* ignore */ }

  return NextResponse.json({
    ok: true,
    data: {
      ...req,
      patientRecordIds: recordIds,
      storageNodes,
      fromHospital: hospitalMap[req.fromHospitalId] ?? null,
      toHospital: hospitalMap[req.toHospitalId] ?? null,
      records,
      // suiAddress of Hospital B's admin (for allowlist)
      recipientSuiAddress,
    },
  });
}
