import { z } from "zod";

export const saveResultSchema = z.object({
  order_item_id: z.string().uuid(),
  value_text: z.string().trim().max(200).optional().or(z.literal("")),
  value_numeric: z.coerce.number().optional(),
  unit: z.string().trim().max(20).optional().or(z.literal("")),
  ref_low: z.coerce.number().optional(),
  ref_high: z.coerce.number().optional(),
  flag: z.enum(["normal", "high", "low", "critical"]).default("normal"),
});

export type SaveResultInput = z.infer<typeof saveResultSchema>;
