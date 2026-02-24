import { z } from "zod";

export const recordStatusSchema = z.enum(["active", "discharged", "transferred"]);
export type RecordStatus = z.infer<typeof recordStatusSchema>;

export const recordGenderSchema = z.enum(["male", "female", "other"]);
export type RecordGender = z.infer<typeof recordGenderSchema>;

export const createRecordSchema = z.object({
  patientCode: z.string().min(1),
  fullName: z.string().min(1),
  age: z.number().int().min(0).max(130),
  gender: recordGenderSchema,
  bloodType: z.string().min(1),
  medicalCondition: z.string().min(1),
  dateOfAdmission: z.number().int().positive(),
  doctorName: z.string().min(1),
  insuranceProvider: z.string().min(1),
  billingAmount: z.number().nonnegative(),
  roomNumber: z.string().min(1),
  admissionType: z.string().min(1),
  dischargeDate: z.number().int().positive(),
  medication: z.string().min(1),
  testResults: z.string().min(1),
  status: recordStatusSchema.default("active"),
});

export const updateRecordSchema = createRecordSchema.partial();

export const listRecordsQuerySchema = z.object({
  q: z.string().optional(),
  medicalCondition: z.string().optional(),
  status: recordStatusSchema.optional(),
  admissionType: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type ListRecordsQuery = z.infer<typeof listRecordsQuerySchema>;

export type PatientRecordDTO = {
  id: string;
  hospitalId: string;
  patientCode: string;
  fullName: string;
  age: number;
  gender: RecordGender;
  bloodType: string;
  medicalCondition: string;
  dateOfAdmission: number;
  doctorName: string;
  insuranceProvider: string;
  billingAmount: number;
  roomNumber: string;
  admissionType: string;
  dischargeDate: number;
  medication: string;
  testResults: string;
  status: RecordStatus;
  createdAt: number;
  updatedAt: number;
};
