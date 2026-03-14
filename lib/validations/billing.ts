import { z } from "zod";

export const createPaymentSchema = z.object({
  order_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  mode: z.enum(["cash", "card", "upi", "net_banking", "insurance"]),
  txn_ref: z.string().trim().max(80).optional().or(z.literal("")),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
