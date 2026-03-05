import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { randomUUID } from "node:crypto";

import { desc, eq } from "drizzle-orm";

import { db } from "./index";
import {
  activityLogs,
  dataShareRequests,
  hospitals,
  patientRecords,
  users,
  zkpExchanges,
} from "./schema";

type CsvRow = {
  Name: string;
  Age: string;
  Gender: string;
  "Blood Type": string;
  "Medical Condition": string;
  "Date of Admission": string;
  Doctor: string;
  Hospital: string;
  "Insurance Provider": string;
  "Billing Amount": string;
  "Room Number": string;
  "Admission Type": string;
  "Discharge Date": string;
  Medication: string;
  "Test Results": string;
};

const NOW = Date.now();

function parseCsvLine(line: string): string[] {
  const output: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      output.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  output.push(current);
  return output.map((value) => value.trim());
}

function toTimestamp(dateText: string): number {
  const value = new Date(dateText).getTime();
  return Number.isFinite(value) ? value : NOW;
}

function normalizeGender(gender: string): "male" | "female" | "other" {
  const value = gender.trim().toLowerCase();
  if (value === "male") return "male";
  if (value === "female") return "female";
  return "other";
}

function mapStatus(dischargeDate: string, index: number): "active" | "discharged" {
  const dischargeAt = toTimestamp(dischargeDate);
  const isRecent = NOW - dischargeAt < 1000 * 60 * 60 * 24 * 30;
  if (isRecent || index % 7 === 0) return "active";
  return "discharged";
}

function hospitalCode(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => part[0])
    .join("");
  return `${base || "HOSP"}-${Math.floor(Math.random() * 900 + 100)}`;
}

async function loadCsvRows(): Promise<CsvRow[]> {
  const csvPath = path.resolve(process.cwd(), "../../bootstraps/healthcare_dataset.csv");
  const stream = fs.createReadStream(csvPath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const rows: CsvRow[] = [];
  let headers: string[] = [];
  let isHeader = true;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const parsed = parseCsvLine(line);

    if (isHeader) {
      headers = parsed;
      isHeader = false;
      continue;
    }

    const entry = Object.fromEntries(headers.map((key, idx) => [key, parsed[idx] ?? ""])) as CsvRow;
    rows.push(entry);
  }

  return rows;
}

async function seed() {
  const rows = await loadCsvRows();

  const byHospital = new Map<string, CsvRow[]>();
  for (const row of rows) {
    const key = row.Hospital;
    if (!byHospital.has(key)) byHospital.set(key, []);
    byHospital.get(key)!.push(row);
  }

  const selectedHospitals = [...byHospital.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);

  await db.delete(activityLogs);
  await db.delete(zkpExchanges);
  await db.delete(dataShareRequests);
  await db.delete(patientRecords);
  await db.delete(users);
  await db.delete(hospitals);

  const hospitalIds: string[] = [];
  const userIdsByHospital = new Map<string, string[]>();
  const patientIdsByHospital = new Map<string, string[]>();

  for (const [hospitalName, hospitalRows] of selectedHospitals) {
    const hospitalId = randomUUID();
    hospitalIds.push(hospitalId);
    userIdsByHospital.set(hospitalId, []);
    patientIdsByHospital.set(hospitalId, []);

    const code = hospitalCode(hospitalName);
    await db.insert(hospitals).values({
      id: hospitalId,
      code,
      name: hospitalName,
      address: `Address for ${hospitalName}`,
      suiAddress: `0x${randomUUID().replace(/-/g, "").slice(0, 40)}`,
      logoUrl: null,
      createdAt: NOW,
    });

    const adminId = randomUUID();
    const doctorId = randomUUID();
    userIdsByHospital.get(hospitalId)!.push(adminId, doctorId);

    await db.insert(users).values([
      {
        id: adminId,
        hospitalId,
        email: `admin.${code.toLowerCase()}@demo.local`,
        name: `${hospitalName} Admin`,
        role: "admin",
        passwordHash: "demo123",
        createdAt: NOW,
      },
      {
        id: doctorId,
        hospitalId,
        email: `doctor.${code.toLowerCase()}@demo.local`,
        name: `${hospitalName} Doctor`,
        role: "doctor",
        passwordHash: "demo123",
        createdAt: NOW,
      },
    ]);

    const records = hospitalRows.slice(0, 50).map((row, index) => {
      const id = randomUUID();
      patientIdsByHospital.get(hospitalId)!.push(id);
      return {
        id,
        hospitalId,
        patientCode: `${code}-PT-${String(index + 1).padStart(3, "0")}`,
        fullName: row.Name,
        age: Number(row.Age) || 0,
        gender: normalizeGender(row.Gender),
        bloodType: row["Blood Type"],
        medicalCondition: row["Medical Condition"],
        dateOfAdmission: toTimestamp(row["Date of Admission"]),
        doctorName: row.Doctor,
        insuranceProvider: row["Insurance Provider"],
        billingAmount: Number(row["Billing Amount"]) || 0,
        roomNumber: row["Room Number"],
        admissionType: row["Admission Type"],
        dischargeDate: toTimestamp(row["Discharge Date"]),
        medication: row.Medication,
        testResults: row["Test Results"],
        status: mapStatus(row["Discharge Date"], index),
        createdAt: NOW - (50 - index) * 1000 * 60 * 60,
        updatedAt: NOW - index * 1000 * 60 * 10,
      };
    });

    await db.insert(patientRecords).values(records);
  }

  if (hospitalIds.length < 3) {
    throw new Error("Not enough hospitals in dataset to build demo seed.");
  }

  const [hospitalA, hospitalB, hospitalC] = hospitalIds;
  const aPatients = patientIdsByHospital.get(hospitalA)!;
  const bPatients = patientIdsByHospital.get(hospitalB)!;
  const cPatients = patientIdsByHospital.get(hospitalC)!;

  const share1Id = randomUUID();
  const share2Id = randomUUID();
  const share3Id = randomUUID();

  await db.insert(dataShareRequests).values([
    {
      id: share1Id,
      fromHospitalId: hospitalA,
      toHospitalId: hospitalB,
      patientRecordIds: JSON.stringify([aPatients[0], aPatients[1]]),
      status: "pending",
      requestMailboxId: "REQ_888",
      requestPublicKey: "PK_TEMP_B",
      walrusBlobId: null,
      blobSize: null,
      storageNodes: null,
      sealPolicyId: null,
      suiTxDigest: null,
      purpose: "Inter-hospital consultation",
      message: "Please review these records.",
      expiresAt: NOW + 1000 * 60 * 60 * 24 * 7,
      createdAt: NOW - 1000 * 60 * 60 * 6,
      respondedAt: null,
      readyAt: null,
      openedAt: null,
      confirmedAt: null,
      sharedAt: null,
    },
    {
      id: share2Id,
      fromHospitalId: hospitalB,
      toHospitalId: hospitalC,
      patientRecordIds: JSON.stringify([bPatients[0]]),
      status: "ready_to_decrypt",
      requestMailboxId: "REQ_889",
      requestPublicKey: "PK_TEMP_C",
      walrusBlobId: "0xWALRUS_X_DATA",
      blobSize: 15 * 1024 * 1024,
      storageNodes: JSON.stringify(["Node_1", "Node_5"]),
      sealPolicyId: "SEAL_001",
      suiTxDigest: "0xsui_prepare_001",
      purpose: "Transfer case summary",
      message: null,
      expiresAt: NOW + 1000 * 60 * 60 * 24 * 10,
      createdAt: NOW - 1000 * 60 * 60 * 30,
      respondedAt: NOW - 1000 * 60 * 60 * 20,
      readyAt: NOW - 1000 * 60 * 60 * 20,
      openedAt: null,
      confirmedAt: null,
      sharedAt: null,
    },
    {
      id: share3Id,
      fromHospitalId: hospitalC,
      toHospitalId: hospitalA,
      patientRecordIds: JSON.stringify([cPatients[0]]),
      status: "completed",
      requestMailboxId: "REQ_890",
      requestPublicKey: "PK_TEMP_A",
      walrusBlobId: "walrus://blob-demo-001",
      blobSize: 8 * 1024 * 1024,
      storageNodes: JSON.stringify(["Node_2", "Node_4"]),
      sealPolicyId: "seal://policy-demo-001",
      suiTxDigest: "0xabc123demo",
      purpose: "Completed shared medical profile",
      message: "Shared with full access.",
      expiresAt: NOW + 1000 * 60 * 60 * 24 * 14,
      createdAt: NOW - 1000 * 60 * 60 * 72,
      respondedAt: NOW - 1000 * 60 * 60 * 65,
      readyAt: NOW - 1000 * 60 * 60 * 65,
      openedAt: NOW - 1000 * 60 * 60 * 64,
      confirmedAt: NOW - 1000 * 60 * 60 * 64,
      sharedAt: NOW - 1000 * 60 * 60 * 64,
    },
  ]);

  const zkp1Id = randomUUID();
  const zkp2Id = randomUUID();
  const zkp3Id = randomUUID();

  await db.insert(zkpExchanges).values([
    {
      id: zkp1Id,
      requestorHospitalId: hospitalA,
      holderHospitalId: hospitalB,
      patientRecordId: bPatients[2],
      circuitId: "dob_attribute",
      requestType: "Verify age range",
      publicInputs: JSON.stringify({ min_dob: 631152000, max_dob: 946684800 }),
      status: "verified_success",
      jobStatus: "succeeded",
      resultLabel: "MATCHED",
      vkeyId: "vkey_demo_001",
      proverJobId: "job-demo-001",
      verifyTxDigest: "0xverify_demo_001",
      proof: JSON.stringify({ pi_a: ["0x1", "0x2"] }),
      publicSignals: JSON.stringify(["1"]),
      verificationResult: true,
      message: "Age proof passed",
      createdAt: NOW - 1000 * 60 * 60 * 50,
      acceptedAt: NOW - 1000 * 60 * 60 * 48,
      verifyingAt: NOW - 1000 * 60 * 60 * 47,
      verifiedAt: NOW - 1000 * 60 * 60 * 47,
      completedAt: NOW - 1000 * 60 * 60 * 47,
    },
    {
      id: zkp2Id,
      requestorHospitalId: hospitalB,
      holderHospitalId: hospitalC,
      patientRecordId: cPatients[1],
      circuitId: "insurance_attribute",
      requestType: "Verify insurance coverage",
      publicInputs: JSON.stringify({ drug_id: "D-102", medication_id: "M-57" }),
      status: "proving",
      jobStatus: "running",
      resultLabel: null,
      vkeyId: "vkey_demo_002",
      proverJobId: "job-demo-002",
      verifyTxDigest: null,
      proof: null,
      publicSignals: null,
      verificationResult: null,
      message: "Processing proof",
      createdAt: NOW - 1000 * 60 * 60 * 4,
      acceptedAt: NOW - 1000 * 60 * 60 * 3,
      verifyingAt: null,
      verifiedAt: null,
      completedAt: null,
    },
    {
      id: zkp3Id,
      requestorHospitalId: hospitalC,
      holderHospitalId: hospitalA,
      patientRecordId: aPatients[3],
      circuitId: "time_effectiveness_analysis",
      requestType: "Verify treatment duration range",
      publicInputs: JSON.stringify({ d_min: 5, d_max: 30 }),
      status: "pending",
      jobStatus: null,
      resultLabel: null,
      vkeyId: null,
      proverJobId: null,
      verifyTxDigest: null,
      proof: null,
      publicSignals: null,
      verificationResult: null,
      message: "Awaiting holder acceptance",
      createdAt: NOW - 1000 * 60 * 60 * 2,
      acceptedAt: null,
      verifyingAt: null,
      verifiedAt: null,
      completedAt: null,
    },
  ]);

  const topUser = await db.query.users.findFirst({
    where: eq(users.hospitalId, hospitalA),
    orderBy: [desc(users.createdAt)],
  });

  await db.insert(activityLogs).values([
    {
      id: randomUUID(),
      hospitalId: hospitalA,
      actorUserId: topUser?.id ?? null,
      type: "record_created",
      title: "New patient record created",
      relatedEntityType: "patient_record",
      relatedEntityId: aPatients[0],
      metadata: JSON.stringify({ patientCode: "seeded" }),
      createdAt: NOW - 1000 * 60 * 60 * 18,
    },
    {
      id: randomUUID(),
      hospitalId: hospitalA,
      actorUserId: topUser?.id ?? null,
      type: "share_requested",
      title: "Outgoing share request submitted",
      relatedEntityType: "sharing",
      relatedEntityId: share1Id,
      metadata: JSON.stringify({ toHospitalId: hospitalB, step: "request_sent", requestMailboxId: "REQ_888" }),
      createdAt: NOW - 1000 * 60 * 60 * 6,
    },
    {
      id: randomUUID(),
      hospitalId: hospitalB,
      actorUserId: userIdsByHospital.get(hospitalB)?.[0] ?? null,
      type: "verification_request_verify",
      title: "Verification request verify",
      relatedEntityType: "verification",
      relatedEntityId: zkp1Id,
      metadata: JSON.stringify({ circuitId: "dob_attribute", step: "verify", result: "MATCHED" }),
      createdAt: NOW - 1000 * 60 * 60 * 47,
    },
  ]);

  console.log("Seed complete.");
  console.log(`Hospitals: ${hospitalIds.length}`);
  console.log(`Users: ${[...userIdsByHospital.values()].flat().length}`);
  console.log(`Patient records: ${[...patientIdsByHospital.values()].flat().length}`);
  console.log("Demo login password for all users: demo123");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
