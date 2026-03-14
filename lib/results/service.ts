import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getOrCreateDefaultTenant } from "@/lib/core/tenant";
import type { SaveResultInput } from "@/lib/validations/results";

export type ResultQueueRow = {
  order_item_id: string;
  order_no: string;
  patient_name: string;
  test_name: string;
  result_status: string;
  value_text: string | null;
  value_numeric: number | null;
  unit: string | null;
  flag: string | null;
};

export async function listResultQueue(): Promise<ResultQueueRow[]> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const itemsRes = await supabase
    .from("order_items")
    .select("id, order_id, test_id, result_status")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(300);

  if (itemsRes.error) {
    throw new Error(`Failed to load result queue: ${itemsRes.error.message}`);
  }

  const itemIds = (itemsRes.data ?? []).map((x) => x.id as string);
  const orderIds = Array.from(new Set((itemsRes.data ?? []).map((x) => x.order_id as string)));
  const testIds = Array.from(new Set((itemsRes.data ?? []).map((x) => x.test_id as string)));

  if (itemIds.length === 0) return [];

  const [resultsRes, ordersRes, testsRes] = await Promise.all([
    supabase.from("results").select("order_item_id, value_text, value_numeric, unit, flag").eq("tenant_id", tenant.id).in("order_item_id", itemIds),
    supabase.from("orders").select("id, order_no, patient_id").eq("tenant_id", tenant.id).in("id", orderIds),
    supabase.from("tests").select("id, test_name").eq("tenant_id", tenant.id).in("id", testIds),
  ]);

  if (resultsRes.error || ordersRes.error || testsRes.error) {
    throw new Error(`Failed to load result metadata: ${resultsRes.error?.message ?? ordersRes.error?.message ?? testsRes.error?.message}`);
  }

  const patientIds = Array.from(new Set((ordersRes.data ?? []).map((o) => o.patient_id as string)));
  const patientsRes = await supabase
    .from("patients")
    .select("id, full_name")
    .eq("tenant_id", tenant.id)
    .in("id", patientIds);

  if (patientsRes.error) {
    throw new Error(`Failed to load patients for result queue: ${patientsRes.error.message}`);
  }

  const resultMap = new Map((resultsRes.data ?? []).map((r) => [r.order_item_id as string, r]));
  const orderMap = new Map((ordersRes.data ?? []).map((o) => [o.id as string, o]));
  const testMap = new Map((testsRes.data ?? []).map((t) => [t.id as string, t.test_name as string]));
  const patientMap = new Map((patientsRes.data ?? []).map((p) => [p.id as string, p.full_name as string]));

  return (itemsRes.data ?? []).map((item) => {
    const order = orderMap.get(item.order_id as string);
    const result = resultMap.get(item.id as string);
    return {
      order_item_id: item.id as string,
      order_no: (order?.order_no as string) ?? "-",
      patient_name: patientMap.get((order?.patient_id as string) ?? "") ?? "-",
      test_name: testMap.get(item.test_id as string) ?? "-",
      result_status: item.result_status as string,
      value_text: (result?.value_text as string | null) ?? null,
      value_numeric: (result?.value_numeric as number | null) ?? null,
      unit: (result?.unit as string | null) ?? null,
      flag: (result?.flag as string | null) ?? null,
    };
  });
}

export async function saveResult(input: SaveResultInput): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const upsertRes = await supabase
    .from("results")
    .upsert(
      {
        tenant_id: tenant.id,
        order_item_id: input.order_item_id,
        value_text: input.value_text || null,
        value_numeric: input.value_numeric ?? null,
        unit: input.unit || null,
        ref_low: input.ref_low ?? null,
        ref_high: input.ref_high ?? null,
        flag: input.flag,
        entered_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,order_item_id" }
    );

  if (upsertRes.error) {
    throw new Error(`Failed to save result: ${upsertRes.error.message}`);
  }

  const itemRes = await supabase
    .from("order_items")
    .update({ result_status: "entered" })
    .eq("tenant_id", tenant.id)
    .eq("id", input.order_item_id);

  if (itemRes.error) {
    throw new Error(`Failed to update order item result status: ${itemRes.error.message}`);
  }
}
