import { z } from "zod";

export const createOrderSchema = z.object({
  patient_id: z.string().uuid(),
  test_ids: z.array(z.string().uuid()).min(1),
  priority: z.enum(["normal", "urgent", "stat"]).default("normal"),
  referring_doctor: z.string().trim().max(120).optional().or(z.literal("")),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
