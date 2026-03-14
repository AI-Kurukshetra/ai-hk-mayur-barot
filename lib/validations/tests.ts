import { z } from "zod";

export const createTestSchema = z.object({
  test_name: z.string().trim().min(2).max(120),
  department: z.string().trim().min(2).max(80),
  sample_type: z.string().trim().min(2).max(80),
  unit: z.string().trim().max(30).optional().or(z.literal("")),
  price: z.coerce.number().min(0),
  tat_hours: z.coerce.number().int().min(1).max(240),
});

export type CreateTestInput = z.infer<typeof createTestSchema>;
