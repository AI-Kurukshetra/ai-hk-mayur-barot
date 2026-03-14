import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getOrCreateDefaultTenant } from "@/lib/core/tenant";

export type OverviewPaymentRow = {
  id: string;
  order_no: string;
  patient_name: string;
  referred_by: string;
  paid_at: string;
  amount: number;
  mode: string;
};

export type OverviewSnapshot = {
  total_billed: number;
  total_collected: number;
  total_due: number;
  order_count: number;
  recent_payments: OverviewPaymentRow[];
};

export async function getOverviewSnapshot(): Promise<OverviewSnapshot> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const ordersRes = await supabase
    .from("orders")
    .select("id, order_no, total_amount, paid_amount, referring_doctor, patient:patients!orders_patient_id_fkey(full_name)")
    .eq("tenant_id", tenant.id)
    .order("ordered_at", { ascending: false })
    .limit(200);

  if (ordersRes.error) {
    throw new Error(`Failed to load overview orders: ${ordersRes.error.message}`);
  }

  const orders = ordersRes.data ?? [];
  const orderIds = orders.map((order) => order.id as string);
  const orderMap = new Map(
    orders.map((order) => {
      const patient = Array.isArray(order.patient) ? order.patient[0] : order.patient;
      return [
        order.id as string,
        {
          order_no: order.order_no as string,
          patient_name: (patient?.full_name as string) ?? "-",
          referred_by: (order.referring_doctor as string | null) ?? "Self",
        },
      ];
    })
  );

  const paymentsRes = orderIds.length
    ? await supabase
        .from("payments")
        .select("id, order_id, amount, mode, paid_at")
        .eq("tenant_id", tenant.id)
        .in("order_id", orderIds)
        .order("paid_at", { ascending: false })
        .limit(300)
    : { data: [], error: null };

  if (paymentsRes.error) {
    throw new Error(`Failed to load overview payments: ${paymentsRes.error.message}`);
  }

  const totalBilled = orders.reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0);
  const totalCollected = orders.reduce((sum, order) => sum + Number(order.paid_amount ?? 0), 0);

  const recentPayments = (paymentsRes.data ?? []).map((payment) => {
    const order = orderMap.get(payment.order_id as string);
    return {
      id: payment.id as string,
      order_no: order?.order_no ?? "-",
      patient_name: order?.patient_name ?? "-",
      referred_by: order?.referred_by ?? "Self",
      paid_at: payment.paid_at as string,
      amount: Number(payment.amount ?? 0),
      mode: payment.mode as string,
    };
  });

  return {
    total_billed: totalBilled,
    total_collected: totalCollected,
    total_due: Math.max(0, totalBilled - totalCollected),
    order_count: orders.length,
    recent_payments: recentPayments,
  };
}
