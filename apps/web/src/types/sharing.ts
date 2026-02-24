import { z } from "zod";

export const shareStatusSchema = z.enum(["pending", "approved", "rejected", "shared", "expired"]);

export const listSharingQuerySchema = z.object({
  status: shareStatusSchema.optional(),
});

export const createShareRequestSchema = z.object({
  toHospitalId: z.string().min(1),
  patientRecordIds: z.array(z.string().min(1)).min(1),
  purpose: z.string().min(3),
  message: z.string().max(1000).optional().nullable(),
  expiresAt: z.number().int().optional().nullable(),
});

export const shareActionSchema = z.object({
  message: z.string().max(1000).optional().nullable(),
  walrusBlobId: z.string().max(255).optional().nullable(),
  sealPolicyId: z.string().max(255).optional().nullable(),
  suiTxDigest: z.string().max(255).optional().nullable(),
});

export type ShareStatus = z.infer<typeof shareStatusSchema>;
