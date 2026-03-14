import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getOrCreateDefaultTenant } from "@/lib/core/tenant";
import type { CreateOrderInput } from "@/lib/validations/orders";

export type OrderRow = {
  id: string;
  order_no: string;
  priority: string;
  status: string;
  total_amount: number;
  ordered_at: string;
  patient: { id: string; full_name: string; patient_code: string };
  item_count: number;
};

export async function listOrders(): Promise<OrderRow[]> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const ordersRes = await supabase
    .from("orders")
    .select("id, order_no, priority, status, total_amount, ordered_at, patient:patients!orders_patient_id_fkey(id, full_name, patient_code)")
    .eq("tenant_id", tenant.id)
    .order("ordered_at", { ascending: false })
    .limit(100);

  if (ordersRes.error) {
    throw new Error(`Failed to load orders: ${ordersRes.error.message}`);
  }

  const ids = (ordersRes.data ?? []).map((o) => o.id);
  const itemCounts = new Map<string, number>();

  if (ids.length > 0) {
    const itemsRes = await supabase
      .from("order_items")
      .select("order_id")
      .eq("tenant_id", tenant.id)
      .in("order_id", ids);

    if (itemsRes.error) {
      throw new Error(`Failed to load order item counts: ${itemsRes.error.message}`);
    }

    for (const row of itemsRes.data ?? []) {
      const key = row.order_id as string;
      itemCounts.set(key, (itemCounts.get(key) ?? 0) + 1);
    }
  }

  return (ordersRes.data ?? []).map((row) => ({
    id: row.id,
    order_no: row.order_no,
    priority: row.priority,
    status: row.status,
    total_amount: Number(row.total_amount ?? 0),
    ordered_at: row.ordered_at,
    patient: Array.isArray(row.patient)
      ? (row.patient[0] as { id: string; full_name: string; patient_code: string })
      : (row.patient as { id: string; full_name: string; patient_code: string }),
    item_count: itemCounts.get(row.id) ?? 0,
  }));
}

export async function createOrder(input: CreateOrderInput): Promise<{ id: string; order_no: string }> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const patientRes = await supabase
    .from("patients")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("id", input.patient_id)
    .maybeSingle();

  if (patientRes.error || !patientRes.data) {
    throw new Error("Invalid patient selected.");
  }

  const testsRes = await supabase
    .from("tests")
    .select("id, price")
    .eq("tenant_id", tenant.id)
    .in("id", input.test_ids);

  if (testsRes.error || !testsRes.data || testsRes.data.length !== input.test_ids.length) {
    throw new Error("One or more selected tests are invalid.");
  }

  const total = testsRes.data.reduce((sum, test) => sum + Number(test.price ?? 0), 0);

  const countRes = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  if (countRes.error) {
    throw new Error(`Failed to generate order number: ${countRes.error.message}`);
  }

  const orderNo = `ORD-${String((countRes.count ?? 0) + 1).padStart(6, "0")}`;

  const orderInsert = await supabase
    .from("orders")
    .insert({
      tenant_id: tenant.id,
      order_no: orderNo,
      patient_id: input.patient_id,
      referring_doctor: input.referring_doctor || null,
      priority: input.priority,
      status: "ordered",
      total_amount: total,
      paid_amount: 0,
    })
    .select("id, order_no")
    .single();

  if (orderInsert.error || !orderInsert.data) {
    throw new Error(`Failed to create order: ${orderInsert.error?.message ?? "Unknown error"}`);
  }

  const items = testsRes.data.map((test) => ({
    tenant_id: tenant.id,
    order_id: orderInsert.data.id,
    test_id: test.id,
    status: "ordered",
    result_status: "pending",
    price: Number(test.price ?? 0),
    discount: 0,
  }));

  const itemsInsert = await supabase
    .from("order_items")
    .insert(items)
    .select("id");

  if (itemsInsert.error || !itemsInsert.data) {
    throw new Error(`Failed to create order items: ${itemsInsert.error?.message ?? "Unknown error"}`);
  }

  const sampleCountRes = await supabase
    .from("samples")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  if (sampleCountRes.error) {
    throw new Error(`Failed to generate sample barcodes: ${sampleCountRes.error.message}`);
  }

  let sampleSequence = (sampleCountRes.count ?? 0) + 1;
  const sampleRows = itemsInsert.data.map((item) => ({
    tenant_id: tenant.id,
    order_item_id: item.id,
    sample_barcode: `SMP-${String(sampleSequence++).padStart(6, "0")}`,
    container_type: "Vacutainer",
    status: "pending_collection",
  }));

  const sampleInsertRes = await supabase.from("samples").insert(sampleRows);
  if (sampleInsertRes.error) {
    throw new Error(`Failed to create samples: ${sampleInsertRes.error.message}`);
  }

  return orderInsert.data;
}
