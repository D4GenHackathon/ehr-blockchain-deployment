import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const hospitals = sqliteTable("hospitals", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  suiAddress: text("sui_address").notNull(),
  logoUrl: text("logo_url"),
  createdAt: integer("created_at").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  hospitalId: text("hospital_id")
    .notNull()
    .references(() => hospitals.id),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "doctor", "staff"] }).notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const patientRecords = sqliteTable("patient_records", {
  id: text("id").primaryKey(),
  hospitalId: text("hospital_id")
    .notNull()
    .references(() => hospitals.id),
  patientCode: text("patient_code").notNull(),
  fullName: text("full_name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender", { enum: ["male", "female", "other"] }).notNull(),
  bloodType: text("blood_type").notNull(),
  medicalCondition: text("medical_condition").notNull(),
  dateOfAdmission: integer("date_of_admission").notNull(),
  doctorName: text("doctor_name").notNull(),
  insuranceProvider: text("insurance_provider").notNull(),
  billingAmount: real("billing_amount").notNull(),
  roomNumber: text("room_number").notNull(),
  admissionType: text("admission_type").notNull(),
  dischargeDate: integer("discharge_date").notNull(),
  medication: text("medication").notNull(),
  testResults: text("test_results").notNull(),
  status: text("status", { enum: ["active", "discharged", "transferred"] })
    .notNull()
    .default("active"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const dataShareRequests = sqliteTable("data_share_requests", {
  id: text("id").primaryKey(),
  fromHospitalId: text("from_hospital_id")
    .notNull()
    .references(() => hospitals.id),
  toHospitalId: text("to_hospital_id")
    .notNull()
    .references(() => hospitals.id),
  patientRecordIds: text("patient_record_ids").notNull(),
  status: text("status", {
    enum: ["pending", "approved", "rejected", "shared", "expired"],
  })
    .notNull()
    .default("pending"),
  walrusBlobId: text("walrus_blob_id"),
  sealPolicyId: text("seal_policy_id"),
  suiTxDigest: text("sui_tx_digest"),
  purpose: text("purpose").notNull(),
  message: text("message"),
  expiresAt: integer("expires_at"),
  createdAt: integer("created_at").notNull(),
  respondedAt: integer("responded_at"),
  sharedAt: integer("shared_at"),
});

export const zkpExchanges = sqliteTable("zkp_exchanges", {
  id: text("id").primaryKey(),
  requestorHospitalId: text("requestor_hospital_id")
    .notNull()
    .references(() => hospitals.id),
  holderHospitalId: text("holder_hospital_id")
    .notNull()
    .references(() => hospitals.id),
  patientRecordId: text("patient_record_id")
    .notNull()
    .references(() => patientRecords.id),
  circuitId: text("circuit_id").notNull(),
  requestType: text("request_type").notNull(),
  publicInputs: text("public_inputs").notNull(),
  status: text("status", {
    enum: [
      "pending",
      "accepted",
      "proof_generating",
      "proof_ready",
      "verified",
      "verification_failed",
      "rejected",
    ],
  })
    .notNull()
    .default("pending"),
  proverJobId: text("prover_job_id"),
  proof: text("proof"),
  publicSignals: text("public_signals"),
  verificationResult: integer("verification_result", { mode: "boolean" }),
  message: text("message"),
  createdAt: integer("created_at").notNull(),
  acceptedAt: integer("accepted_at"),
  completedAt: integer("completed_at"),
});

export const activityLogs = sqliteTable("activity_logs", {
  id: text("id").primaryKey(),
  hospitalId: text("hospital_id")
    .notNull()
    .references(() => hospitals.id),
  actorUserId: text("actor_user_id").references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  relatedEntityType: text("related_entity_type").notNull(),
  relatedEntityId: text("related_entity_id").notNull(),
  metadata: text("metadata"),
  createdAt: integer("created_at").notNull(),
});
