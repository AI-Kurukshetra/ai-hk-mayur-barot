import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getOrCreateDefaultTenant } from "@/lib/core/tenant";
import type { CreatePaymentInput } from "@/lib/validations/billing";

export type BillingOrderRow = {
  order_id: string;
  order_no: string;
  patient_name: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: string;
};

export type PaymentRow = {
  id: string;
  order_no: string;
  patient_name: string;
  amount: number;
  mode: string;
  txn_ref: string | null;
  paid_at: string;
};

export type BillingSnapshot = {
  orders: BillingOrderRow[];
  payments: PaymentRow[];
};

export async function listBillingSnapshot(): Promise<BillingSnapshot> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const ordersRes = await supabase
    .from("orders")
    .select("id, order_no, status, total_amount, paid_amount, patient:patients!orders_patient_id_fkey(full_name)")
    .eq("tenant_id", tenant.id)
    .order("ordered_at", { ascending: false })
    .limit(200);

  if (ordersRes.error) {
    throw new Error(`Failed to load billing orders: ${ordersRes.error.message}`);
  }

  const orderIds = (ordersRes.data ?? []).map((o) => o.id as string);

  const paymentsRes = orderIds.length
    ? await supabase
        .from("payments")
        .select("id, order_id, amount, mode, txn_ref, paid_at")
        .eq("tenant_id", tenant.id)
        .in("order_id", orderIds)
        .order("paid_at", { ascending: false })
        .limit(200)
    : { data: [], error: null };

  if (paymentsRes.error) {
    throw new Error(`Failed to load payments: ${paymentsRes.error.message}`);
  }

  const orderMap = new Map((ordersRes.data ?? []).map((o) => [o.id as string, o]));

  const orders = (ordersRes.data ?? []).map((o) => {
    const patient = Array.isArray(o.patient) ? o.patient[0] : o.patient;
    const total = Number(o.total_amount ?? 0);
    const paid = Number(o.paid_amount ?? 0);

    return {
      order_id: o.id as string,
      order_no: o.order_no as string,
      patient_name: (patient?.full_name as string) ?? "-",
      total_amount: total,
      paid_amount: paid,
      due_amount: Math.max(0, total - paid),
      status: o.status as string,
    };
  });

  const payments = (paymentsRes.data ?? []).map((p) => {
    const order = orderMap.get(p.order_id as string);
    const patient = order ? (Array.isArray(order.patient) ? order.patient[0] : order.patient) : null;
    return {
      id: p.id as string,
      order_no: (order?.order_no as string) ?? "-",
      patient_name: (patient?.full_name as string) ?? "-",
      amount: Number(p.amount ?? 0),
      mode: p.mode as string,
      txn_ref: (p.txn_ref as string | null) ?? null,
      paid_at: p.paid_at as string,
    };
  });

  return { orders, payments };
}

export async function recordPayment(input: CreatePaymentInput): Promise<{ payment_id: string; paid_amount: number; due_amount: number }> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const orderRes = await supabase
    .from("orders")
    .select("id, total_amount, paid_amount")
    .eq("tenant_id", tenant.id)
    .eq("id", input.order_id)
    .maybeSingle();

  if (orderRes.error || !orderRes.data) {
    throw new Error("Order not found for payment.");
  }

  const currentPaid = Number(orderRes.data.paid_amount ?? 0);
  const total = Number(orderRes.data.total_amount ?? 0);
  const newPaid = Math.min(total, currentPaid + input.amount);

  const payRes = await supabase
    .from("payments")
    .insert({
      tenant_id: tenant.id,
      order_id: input.order_id,
      amount: input.amount,
      mode: input.mode,
      txn_ref: input.txn_ref || null,
      paid_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (payRes.error || !payRes.data) {
    throw new Error(`Failed to record payment: ${payRes.error?.message ?? "Unknown error"}`);
  }

  const updateRes = await supabase
    .from("orders")
    .update({ paid_amount: newPaid })
    .eq("tenant_id", tenant.id)
    .eq("id", input.order_id);

  if (updateRes.error) {
    throw new Error(`Failed to update order payment totals: ${updateRes.error.message}`);
  }

  return {
    payment_id: payRes.data.id as string,
    paid_amount: newPaid,
    due_amount: Math.max(0, total - newPaid),
  };
}
