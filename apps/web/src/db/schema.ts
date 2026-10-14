import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const hospitals = sqliteTable("hospitals", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  suiAddress: text("sui_address").notNull(),
  organizationType: text("organization_type", {
    enum: ["healthcare_provider", "clinical_research", "commercial_biotech"],
  })
    .notNull()
    .default("healthcare_provider"),
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
  // Sui wallet linking
  suiAddress: text("sui_address").unique(),
  walletLinkedAt: integer("wallet_linked_at"),
  walletNonce: text("wallet_nonce"),
  walletNonceAt: integer("wallet_nonce_at"),
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
  dataLevel: text("data_level", {
    enum: ["full_ehr", "selected_attributes", "metadata_only", "non_ehr"],
  })
    .notNull()
    .default("full_ehr"),
  sourceType: text("source_type", { enum: ["native", "imported", "synthetic"] })
    .notNull()
    .default("native"),
  isSensitive: integer("is_sensitive", { mode: "boolean" }).notNull().default(true),
  recordCommitment: text("record_commitment"),
  demographicHash: text("demographic_hash"),
  zkProfile: text("zk_profile"),
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
    enum: [
      "pending",
      "preparing",
      "approved",
      "ready_to_decrypt",
      "opened",
      "confirmed",
      "completed",
      "rejected",
      "expired",
    ],
  })
    .notNull()
    .default("pending"),
  requestMailboxId: text("request_mailbox_id"),
  requestPublicKey: text("request_public_key"),
  walrusBlobId: text("walrus_blob_id"),
  blobSize: integer("blob_size"),
  storageNodes: text("storage_nodes"),
  sealPolicyId: text("seal_policy_id"),
  suiTxDigest: text("sui_tx_digest"),
  purpose: text("purpose").notNull(),
  message: text("message"),
  expiresAt: integer("expires_at"),
  createdAt: integer("created_at").notNull(),
  respondedAt: integer("responded_at"),
  readyAt: integer("ready_at"),
  openedAt: integer("opened_at"),
  confirmedAt: integer("confirmed_at"),
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
      "proving",
      "verify_submitted",
      "verified_success",
      "verified_failed",
      "rejected",
    ],
  })
    .notNull()
    .default("pending"),
  jobStatus: text("job_status"),
  resultLabel: text("result_label"),
  vkeyId: text("vkey_id"),
  /** On-chain `zk_verifier::ConsentObject` created when the holder accepts. */
  consentObjectId: text("consent_object_id"),
  proverJobId: text("prover_job_id"),
  verifyTxDigest: text("verify_tx_digest"),
  proof: text("proof"),
  publicSignals: text("public_signals"),
  verificationResult: integer("verification_result", { mode: "boolean" }),
  message: text("message"),
  createdAt: integer("created_at").notNull(),
  acceptedAt: integer("accepted_at"),
  verifyingAt: integer("verifying_at"),
  verifiedAt: integer("verified_at"),
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
