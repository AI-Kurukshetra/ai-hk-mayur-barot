import { z } from "zod";

export const createPatientSchema = z.object({
  full_name: z.string().trim().min(2, "Full name must be at least 2 characters").max(120),
  sex: z.enum(["male", "female", "other"]),
  dob: z.string().optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  address: z.string().trim().max(240).optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
