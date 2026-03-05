import { z } from "zod";

export const shareStatusSchema = z.enum([
  "pending",
  "preparing",
  "approved",
  "ready_to_decrypt",
  "opened",
  "confirmed",
  "completed",
  "rejected",
  "expired",
]);

export const listSharingQuerySchema = z.object({
  status: shareStatusSchema.optional(),
});

export const createShareRequestSchema = z.object({
  toHospitalId: z.string().min(1),
  patientRecordIds: z.array(z.string().min(1)).min(1),
  purpose: z.string().min(3),
  requestPublicKey: z.string().max(255).optional().nullable(),
  message: z.string().max(1000).optional().nullable(),
  expiresAt: z.number().int().optional().nullable(),
});

export const shareActionSchema = z.object({
  step: z
    .enum(["load_internal", "encrypt_upload", "seal_generation", "decrypting"])
    .optional(),
  message: z.string().max(1000).optional().nullable(),
  walrusBlobId: z.string().max(255).optional().nullable(),
  blobSize: z.number().int().positive().optional().nullable(),
  storageNodes: z.array(z.string()).optional().nullable(),
  sealPolicyId: z.string().max(255).optional().nullable(),
  suiTxDigest: z.string().max(255).optional().nullable(),
});

export type ShareStatus = z.infer<typeof shareStatusSchema>;
