import { z } from "zod";

export const updateSampleStatusSchema = z.object({
  sample_id: z.string().uuid(),
  status: z.enum(["pending_collection", "collected", "received", "rejected", "disposed"]),
});

export type UpdateSampleStatusInput = z.infer<typeof updateSampleStatusSchema>;
