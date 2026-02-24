import { z } from "zod";

export const verificationStatusSchema = z.enum([
  "pending",
  "accepted",
  "proof_generating",
  "proof_ready",
  "verified",
  "verification_failed",
  "rejected",
]);

export const listVerificationQuerySchema = z.object({
  status: verificationStatusSchema.optional(),
});

export const createVerificationSchema = z.object({
  holderHospitalId: z.string().min(1),
  patientRecordId: z.string().min(1),
  circuitId: z.string().min(1),
  requestType: z.string().min(3),
  publicInputs: z.record(z.string(), z.unknown()),
  message: z.string().max(1000).optional().nullable(),
});

export const verificationActionSchema = z.object({
  message: z.string().max(1000).optional().nullable(),
});

export type VerificationStatus = z.infer<typeof verificationStatusSchema>;
