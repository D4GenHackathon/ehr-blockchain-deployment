import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { activityLogs, dataShareRequests, hospitals, patientRecords } from "@/db/schema";
import { requireAuthSession } from "@/lib/auth";
import { createShareRequestSchema, listSharingQuerySchema } from "@/types/sharing";

function parseRecordIds(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((value) => String(value).trim()).filter(Boolean);
      }
    } catch {
      // fallback to comma parser
    }
  }
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function stringifyRecordIds(recordIds: string[]) {
  return JSON.stringify(recordIds);
}

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
      { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid session." } },
      { status: 401 }
    );
  }

  const parsedQuery = listSharingQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );
  if (!parsedQuery.success) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_QUERY", message: parsedQuery.error.message } },
      { status: 400 }
    );
  }

  const { status } = parsedQuery.data;
  const filters = [
    or(
      eq(dataShareRequests.fromHospitalId, hospitalId),
      eq(dataShareRequests.toHospitalId, hospitalId)
    )!,
  ];
  if (status) filters.push(eq(dataShareRequests.status, status));

  const requests = await db
    .select()
    .from(dataShareRequests)
    .where(and(...filters))
    .orderBy(desc(dataShareRequests.createdAt), asc(dataShareRequests.id));

  const hospitalRows = await db
    .select({ id: hospitals.id, name: hospitals.name, code: hospitals.code })
    .from(hospitals)
    .orderBy(asc(hospitals.name));

  const myRecords = await db
    .select({
      id: patientRecords.id,
      patientCode: patientRecords.patientCode,
      fullName: patientRecords.fullName,
      medicalCondition: patientRecords.medicalCondition,
    })
    .from(patientRecords)
    .where(eq(patientRecords.hospitalId, hospitalId))
    .orderBy(desc(patientRecords.createdAt))
    .limit(100);

  const uniqueRecordIds = Array.from(
    new Set(requests.flatMap((item) => parseRecordIds(item.patientRecordIds)))
  );

  const relatedRecords =
    uniqueRecordIds.length > 0
      ? await db
          .select({
            id: patientRecords.id,
            patientCode: patientRecords.patientCode,
            fullName: patientRecords.fullName,
          })
          .from(patientRecords)
          .where(inArray(patientRecords.id, uniqueRecordIds))
      : [];

  const recordMap = Object.fromEntries(relatedRecords.map((item) => [item.id, item]));
  const hospitalMap = Object.fromEntries(hospitalRows.map((item) => [item.id, item]));

  const normalized = requests.map((requestItem) => {
    const parsedIds = parseRecordIds(requestItem.patientRecordIds);
    return {
      ...requestItem,
      patientRecordIds: parsedIds,
      records: parsedIds.map((id) => recordMap[id]).filter(Boolean),
      fromHospital: hospitalMap[requestItem.fromHospitalId] ?? null,
      toHospital: hospitalMap[requestItem.toHospitalId] ?? null,
      direction: requestItem.fromHospitalId === hospitalId ? "outgoing" : "incoming",
    };
  });

  return NextResponse.json({
    ok: true,
    data: {
      outgoing: normalized.filter((item) => item.direction === "outgoing"),
      incoming: normalized.filter((item) => item.direction === "incoming"),
      options: {
        hospitals: hospitalRows.filter((item) => item.id !== hospitalId),
        myRecords,
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
      { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid session." } },
      { status: 401 }
    );
  }

  const parsedBody = createShareRequestSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_INPUT", message: parsedBody.error.message } },
      { status: 400 }
    );
  }

  const { toHospitalId, patientRecordIds, purpose, message, expiresAt } = parsedBody.data;
  if (toHospitalId === hospitalId) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_TARGET", message: "Cannot create request to the same hospital." },
      },
      { status: 400 }
    );
  }

  const targetHospital = await db
    .select({ id: hospitals.id })
    .from(hospitals)
    .where(eq(hospitals.id, toHospitalId))
    .limit(1);
  if (targetHospital.length === 0) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Target hospital not found." } },
      { status: 404 }
    );
  }

  const ownedRecords = await db
    .select({ id: patientRecords.id })
    .from(patientRecords)
    .where(
      and(
        eq(patientRecords.hospitalId, hospitalId),
        inArray(patientRecords.id, patientRecordIds)
      )
    );

  if (ownedRecords.length !== patientRecordIds.length) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_RECORD_SCOPE",
          message: "One or more records do not belong to your hospital.",
        },
      },
      { status: 400 }
    );
  }

  const now = Date.now();
  const id = crypto.randomUUID();
  await db.insert(dataShareRequests).values({
    id,
    fromHospitalId: hospitalId,
    toHospitalId,
    patientRecordIds: stringifyRecordIds(patientRecordIds),
    purpose,
    message: message ?? null,
    expiresAt: expiresAt ?? null,
    status: "pending",
    createdAt: now,
  });

  await db.insert(activityLogs).values([
    {
      id: crypto.randomUUID(),
      hospitalId,
      actorUserId: session.userId,
      type: "sharing_request_created",
      title: "Created a data sharing request",
      relatedEntityType: "sharing",
      relatedEntityId: id,
      metadata: JSON.stringify({ toHospitalId, patientRecordIdsCount: patientRecordIds.length }),
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      hospitalId: toHospitalId,
      actorUserId: null,
      type: "sharing_request_received",
      title: "Received a data sharing request",
      relatedEntityType: "sharing",
      relatedEntityId: id,
      metadata: JSON.stringify({ fromHospitalId: hospitalId, patientRecordIdsCount: patientRecordIds.length }),
      createdAt: now,
    },
  ]);

  return NextResponse.json({ ok: true, data: { id } }, { status: 201 });
}
