import { z } from "zod";

export const releaseReportSchema = z.object({
  order_id: z.string().uuid(),
});

export type ReleaseReportInput = z.infer<typeof releaseReportSchema>;
