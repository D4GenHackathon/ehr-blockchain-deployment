import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { hospitals, patientRecords } from "@/db/schema";
import type { AuthRole, AuthSessionData } from "@/lib/auth";

export type OrganizationType = "healthcare_provider" | "clinical_research" | "commercial_biotech";
export type DataLevel = "full_ehr" | "selected_attributes" | "metadata_only" | "non_ehr";
export type SourceType = "native" | "imported" | "synthetic";
export type AccessLevel = "full" | "selected" | "metadata";

export const ORG_LIMITS: Record<
  OrganizationType,
  { maxStoredRecords: number; maxSharedRecords: number; canShareFullEhr: boolean; accessLevel: AccessLevel }
> = {
  healthcare_provider: {
    maxStoredRecords: 500,
    maxSharedRecords: 500,
    canShareFullEhr: true,
    accessLevel: "full",
  },
  clinical_research: {
    maxStoredRecords: 300,
    maxSharedRecords: 200,
    canShareFullEhr: true,
    accessLevel: "selected",
  },
  commercial_biotech: {
    maxStoredRecords: 300,
    maxSharedRecords: 0,
    canShareFullEhr: false,
    accessLevel: "metadata",
  },
};

export class ComplianceError extends Error {
  constructor(
    public readonly code:
      | "UNAUTHORIZED"
      | "FORBIDDEN_ROLE"
      | "FORBIDDEN_ORG_TYPE"
      | "DATA_LEVEL_DENIED"
      | "LIMIT_EXCEEDED",
    message: string,
    public readonly status = code === "UNAUTHORIZED" ? 401 : code === "LIMIT_EXCEEDED" ? 400 : 403,
  ) {
    super(message);
  }
}

export interface ComplianceContext {
  userId: string;
  hospitalId: string;
  role: AuthRole;
  organizationType: OrganizationType;
}

export async function getComplianceContext(session: AuthSessionData | null): Promise<ComplianceContext> {
  if (!session?.isLoggedIn || !session.userId || !session.hospitalId || !session.role) {
    throw new ComplianceError("UNAUTHORIZED", "Not authenticated.");
  }

  const [hospital] = await db
    .select({ organizationType: hospitals.organizationType })
    .from(hospitals)
    .where(eq(hospitals.id, session.hospitalId))
    .limit(1);

  if (!hospital) {
    throw new ComplianceError("UNAUTHORIZED", "Invalid hospital context.");
  }

  return {
    userId: session.userId,
    hospitalId: session.hospitalId,
    role: session.role,
    organizationType: hospital.organizationType,
  };
}

export function complianceResponse(error: unknown) {
  if (error instanceof ComplianceError) {
    return NextResponse.json(
      { ok: false, error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  return null;
}

function ensureClinicalActor(ctx: ComplianceContext, action: string) {
  if (!["admin", "doctor"].includes(ctx.role)) {
    throw new ComplianceError("FORBIDDEN_ROLE", `Only admins and doctors can ${action}.`);
  }
}

export function accessLevelFor(ctx: ComplianceContext): AccessLevel {
  if (ctx.role === "staff") {
    return "metadata";
  }
  return ORG_LIMITS[ctx.organizationType].accessLevel;
}

export function assertCanCreateRecord(ctx: ComplianceContext, existingCount: number, dataLevel: DataLevel) {
  ensureClinicalActor(ctx, "create patient records");
  const limits = ORG_LIMITS[ctx.organizationType];
  if (existingCount >= limits.maxStoredRecords) {
    throw new ComplianceError(
      "LIMIT_EXCEEDED",
      `This organization can store at most ${limits.maxStoredRecords} EHR records.`,
    );
  }
  if (ctx.organizationType === "commercial_biotech" && dataLevel !== "non_ehr") {
    throw new ComplianceError("DATA_LEVEL_DENIED", "Commercial/biotech organizations can only create non-EHR records.");
  }
  if (ctx.organizationType === "clinical_research" && dataLevel === "full_ehr") {
    throw new ComplianceError("DATA_LEVEL_DENIED", "Clinical/research organizations can store selected attributes only.");
  }
}

export function assertCanMutateRecord(ctx: ComplianceContext, action: "update" | "delete") {
  ensureClinicalActor(ctx, `${action} patient records`);
  if (ctx.organizationType === "commercial_biotech") {
    throw new ComplianceError("FORBIDDEN_ORG_TYPE", "Commercial/biotech organizations cannot mutate EHR records.");
  }
}

export function assertCanShareRecords(
  requester: ComplianceContext,
  holderOrganizationType: OrganizationType,
  recordCount: number,
) {
  ensureClinicalActor(requester, "request record sharing");
  if (requester.organizationType === "commercial_biotech" || holderOrganizationType === "commercial_biotech") {
    throw new ComplianceError("FORBIDDEN_ORG_TYPE", "Commercial/biotech organizations cannot share EHR records.");
  }
  const maxShared = ORG_LIMITS[holderOrganizationType].maxSharedRecords;
  if (recordCount > maxShared) {
    throw new ComplianceError("LIMIT_EXCEEDED", `The holder organization can share at most ${maxShared} records.`);
  }
}

export function assertCanApproveShare(ctx: ComplianceContext, recordCount: number) {
  ensureClinicalActor(ctx, "approve EHR sharing");
  const limits = ORG_LIMITS[ctx.organizationType];
  if (!limits.canShareFullEhr) {
    throw new ComplianceError("FORBIDDEN_ORG_TYPE", "This organization type cannot share EHR records.");
  }
  if (recordCount > limits.maxSharedRecords) {
    throw new ComplianceError("LIMIT_EXCEEDED", `This organization can share at most ${limits.maxSharedRecords} records.`);
  }
}

export function assertCanImportRecords(ctx: ComplianceContext, importCount: number, existingCount: number) {
  ensureClinicalActor(ctx, "import shared records");
  const limits = ORG_LIMITS[ctx.organizationType];
  if (ctx.organizationType === "commercial_biotech") {
    throw new ComplianceError("FORBIDDEN_ORG_TYPE", "Commercial/biotech organizations cannot import EHR records.");
  }
  if (existingCount + importCount > limits.maxStoredRecords) {
    throw new ComplianceError(
      "LIMIT_EXCEEDED",
      `Import would exceed this organization's ${limits.maxStoredRecords}-record storage limit.`,
    );
  }
}

export function assertCanUseZkp(ctx: ComplianceContext, action: string) {
  ensureClinicalActor(ctx, action);
  if (ctx.organizationType === "commercial_biotech") {
    throw new ComplianceError("FORBIDDEN_ORG_TYPE", "Commercial/biotech organizations cannot request sensitive ZKP insights.");
  }
}

export async function countRecordsForHospital(hospitalId: string) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(patientRecords)
    .where(eq(patientRecords.hospitalId, hospitalId));
  return value ?? 0;
}

export function projectRecordForAccess<T extends object>(record: T, ctx: ComplianceContext): T {
  const level = accessLevelFor(ctx);
  if (level === "full") return record;
  const source = record as Record<string, unknown>;

  const metadata = {
    id: source.id,
    hospitalId: source.hospitalId,
    patientCode: source.patientCode,
    fullName: level === "selected" ? source.fullName : "Restricted patient",
    medicalCondition: source.medicalCondition,
    admissionType: source.admissionType,
    status: source.status,
    dataLevel: source.dataLevel,
    sourceType: source.sourceType,
    isSensitive: source.isSensitive,
    recordCommitment: source.recordCommitment,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };

  if (level === "metadata") {
    return metadata as T;
  }

  return {
    ...metadata,
    age: source.age,
    gender: source.gender,
    bloodType: source.bloodType,
    dateOfAdmission: source.dateOfAdmission,
    dischargeDate: source.dischargeDate,
    demographicHash: source.demographicHash,
  } as T;
}

export function projectRecordsForAccess<T extends object>(records: T[], ctx: ComplianceContext): T[] {
  return records.map((record) => projectRecordForAccess(record, ctx));
}
