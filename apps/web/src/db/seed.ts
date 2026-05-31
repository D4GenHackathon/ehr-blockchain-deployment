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

const organizationTypes = ["healthcare_provider", "clinical_research", "commercial_biotech"] as const;

function demoZkProfile(_index: number) {
  return {
    dob_attribute: {
      private: {
        dob: "760579200",
        dob_salt: "16041374243816069654935404236629613181250989595443635222853621720711403605346",
      },
      commitments: {
        dob_hash: "809404399588299624456363691424520836953277040173276852987784675048643461255",
      },
    },
    insurance_attribute: {
      private: {
        insurance_provider: "302",
        insurance_salt: "12529975013957004497641211855699345353077954812412101067951585425356314652205",
        merkle_proof: [
          "3676357734945186725579178647319753768329775997778282931362890662286012723372",
          "18453311860191443451491618387266834562465695327413759861324246823287017022294",
          "724703168180245039145217914241692904107317227362630421560418671314000252370",
          "3794682970905537935658267317800800932489942659529257015114295103036678333420",
          "15352110808169740223510993362249921224642788486242174780206603494029620841337",
          "19712377064642672829441595136074946683621277828620209496774504837737984048981",
          "20775607673010627194014556968476266066927294572720319469184847051418138353016",
          "3396914609616007258851405644437304192397291162432396347162513310381425243293",
          "21551820661461729022865262380882070649935529853313286572328683688269863701601",
          "6573136701248752079028194407151022595060682063033565181951145966236778420039",
          "12413880268183407374852357075976609371175688755676981206018884971008854919922",
          "14271763308400718165336499097156975241954733520325982997864342600795471836726",
          "20066985985293572387227381049700832219069292839614107140851619262827735677018",
          "9394776414966240069580838672673694685292165040808226440647796406499139370960",
          "11331146992410411304059858900317123658895005918277453009197229807340014528524",
          "15819538789928229930262697811477882737253464456578333862691129291651619515538",
        ],
        merkle_path: ["0", "0", "0", "1", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
      },
      commitments: {
        insurance_hash: "5982074870094445944547782472164859579655368977844464630858861407818424502586",
        merkle_root: "9588891621072504966089309417084675145294811533915910528079112419023208860643",
        g: "0",
      },
    },
    time_effectiveness_analysis: {
      private: {
        a_p: "1706659200",
        d_p: "1706832000",
        m_p: "102",
        t_p: "204",
        date_salt: "11663004088340859477613135922106039060216230716104340882779838459180992531020",
        m_merkle_proof: [
          "161312542322796803597691156609734289889268319148237324933342420800684781301",
          "282384191130903457999283806326910225391298088610803690714211130322841291080",
          "16476430771022366278247521591395675155678817981745127663648163066607757280853",
          "11286972368698509976183087595462810875513684078608517520839298933882497716792",
          "3607627140608796879659380071776844901612302623152076817094415224584923813162",
          "19712377064642672829441595136074946683621277828620209496774504837737984048981",
          "20775607673010627194014556968476266066927294572720319469184847051418138353016",
          "3396914609616007258851405644437304192397291162432396347162513310381425243293",
          "21551820661461729022865262380882070649935529853313286572328683688269863701601",
          "6573136701248752079028194407151022595060682063033565181951145966236778420039",
          "12413880268183407374852357075976609371175688755676981206018884971008854919922",
          "14271763308400718165336499097156975241954733520325982997864342600795471836726",
          "20066985985293572387227381049700832219069292839614107140851619262827735677018",
          "9394776414966240069580838672673694685292165040808226440647796406499139370960",
          "11331146992410411304059858900317123658895005918277453009197229807340014528524",
          "15819538789928229930262697811477882737253464456578333862691129291651619515538",
        ],
        m_merkle_path: ["1", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
        t_merkle_proof: [
          "13384311432138527785476806613771539678741783155265589525930270673117009956731",
          "20981933200379589940642524236974352286339067274902423074931463055138298676425",
          "1155235448445270962695354127637551890106586650451305931561981451793577909256",
          "11286972368698509976183087595462810875513684078608517520839298933882497716792",
          "3607627140608796879659380071776844901612302623152076817094415224584923813162",
          "19712377064642672829441595136074946683621277828620209496774504837737984048981",
          "20775607673010627194014556968476266066927294572720319469184847051418138353016",
          "3396914609616007258851405644437304192397291162432396347162513310381425243293",
          "21551820661461729022865262380882070649935529853313286572328683688269863701601",
          "6573136701248752079028194407151022595060682063033565181951145966236778420039",
          "12413880268183407374852357075976609371175688755676981206018884971008854919922",
          "14271763308400718165336499097156975241954733520325982997864342600795471836726",
          "20066985985293572387227381049700832219069292839614107140851619262827735677018",
          "9394776414966240069580838672673694685292165040808226440647796406499139370960",
          "11331146992410411304059858900317123658895005918277453009197229807340014528524",
          "15819538789928229930262697811477882737253464456578333862691129291651619515538",
        ],
        t_merkle_path: ["1", "1", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
      },
      commitments: {
        up: "10852729129872274982171633350536234727224478219697318331386823329017905245619",
        m_merkle_root: "12191372273533648900455405714093412242911296608717350692049944403844683308554",
        t_merkle_root: "17926620055923242424491112321760674550688464367330593025857148544414661777905",
      },
    },
  };
}

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

  for (const [hospitalIndex, [hospitalName, hospitalRows]] of selectedHospitals.entries()) {
    const hospitalId = randomUUID();
    const organizationType = organizationTypes[hospitalIndex] ?? "healthcare_provider";
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
      organizationType,
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
        dataLevel: (
          organizationType === "commercial_biotech"
            ? "non_ehr"
            : organizationType === "clinical_research"
              ? "selected_attributes"
              : "full_ehr"
        ) as "full_ehr" | "selected_attributes" | "metadata_only" | "non_ehr",
        sourceType: "synthetic" as const,
        isSensitive: organizationType !== "commercial_biotech",
        recordCommitment: `commitment:${id}`,
        demographicHash: `demographic:${id}`,
        zkProfile: JSON.stringify(demoZkProfile(index)),
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
      toHospitalId: hospitalA,
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
      fromHospitalId: hospitalA,
      toHospitalId: hospitalB,
      patientRecordIds: JSON.stringify([bPatients[1]]),
      status: "completed",
      requestMailboxId: "REQ_890",
      requestPublicKey: "PK_TEMP_B",
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
      holderHospitalId: hospitalA,
      patientRecordId: aPatients[2],
      circuitId: "insurance_attribute",
      requestType: "Verify insurance coverage",
      publicInputs: JSON.stringify({ drug_id: "1001", medication_id: "204" }),
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
      requestorHospitalId: hospitalA,
      holderHospitalId: hospitalB,
      patientRecordId: bPatients[3],
      circuitId: "time_effectiveness_analysis",
      requestType: "Verify treatment duration range",
      publicInputs: JSON.stringify({ d_min: "86400", d_max: "2592000", t_target: "204", m_target: "102" }),
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
