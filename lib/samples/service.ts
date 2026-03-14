import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getOrCreateDefaultTenant } from "@/lib/core/tenant";
import type { UpdateSampleStatusInput } from "@/lib/validations/samples";

export type SampleRow = {
  id: string;
  sample_barcode: string;
  status: string;
  collected_at: string | null;
  received_at: string | null;
  order_no: string;
  patient_name: string;
  test_name: string;
};

async function ensureSamplesExist() {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const itemsRes = await supabase
    .from("order_items")
    .select("id")
    .eq("tenant_id", tenant.id);

  if (itemsRes.error) {
    throw new Error(`Failed to inspect order items: ${itemsRes.error.message}`);
  }

  const itemIds = (itemsRes.data ?? []).map((x) => x.id as string);
  if (itemIds.length === 0) {
    return;
  }

  const existingRes = await supabase
    .from("samples")
    .select("order_item_id")
    .eq("tenant_id", tenant.id)
    .in("order_item_id", itemIds);

  if (existingRes.error) {
    throw new Error(`Failed to inspect existing samples: ${existingRes.error.message}`);
  }

  const existing = new Set((existingRes.data ?? []).map((x) => x.order_item_id as string));

  const countRes = await supabase
    .from("samples")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  if (countRes.error) {
    throw new Error(`Failed to generate barcode sequence: ${countRes.error.message}`);
  }

  let seq = (countRes.count ?? 0) + 1;
  const toInsert: Array<Record<string, unknown>> = [];

  for (const itemId of itemIds) {
    if (existing.has(itemId)) continue;

    toInsert.push({
      tenant_id: tenant.id,
      order_item_id: itemId,
      sample_barcode: `SMP-${String(seq).padStart(6, "0")}`,
      container_type: "Vacutainer",
      status: "pending_collection",
    });
    seq += 1;
  }

  if (toInsert.length > 0) {
    const insertRes = await supabase.from("samples").insert(toInsert);
    if (insertRes.error) {
      throw new Error(`Failed to backfill samples: ${insertRes.error.message}`);
    }
  }
}

export async function listSamples(): Promise<SampleRow[]> {
  await ensureSamplesExist();

  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const samplesRes = await supabase
    .from("samples")
    .select("id, sample_barcode, status, collected_at, received_at, order_item_id")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (samplesRes.error) {
    throw new Error(`Failed to load samples: ${samplesRes.error.message}`);
  }

  const itemIds = (samplesRes.data ?? []).map((s) => s.order_item_id as string);
  if (itemIds.length === 0) return [];

  const itemsRes = await supabase
    .from("order_items")
    .select("id, order_id, test_id")
    .eq("tenant_id", tenant.id)
    .in("id", itemIds);

  if (itemsRes.error) {
    throw new Error(`Failed to load order item details: ${itemsRes.error.message}`);
  }

  const orderIds = Array.from(new Set((itemsRes.data ?? []).map((x) => x.order_id as string)));
  const testIds = Array.from(new Set((itemsRes.data ?? []).map((x) => x.test_id as string)));

  const [ordersRes, testsRes] = await Promise.all([
    supabase.from("orders").select("id, order_no, patient_id").eq("tenant_id", tenant.id).in("id", orderIds),
    supabase.from("tests").select("id, test_name").eq("tenant_id", tenant.id).in("id", testIds),
  ]);

  if (ordersRes.error || testsRes.error) {
    throw new Error(`Failed to load order/test metadata: ${ordersRes.error?.message ?? testsRes.error?.message}`);
  }

  const patientIds = Array.from(new Set((ordersRes.data ?? []).map((x) => x.patient_id as string)));
  const patientsRes = await supabase
    .from("patients")
    .select("id, full_name")
    .eq("tenant_id", tenant.id)
    .in("id", patientIds);

  if (patientsRes.error) {
    throw new Error(`Failed to load patient metadata: ${patientsRes.error.message}`);
  }

  const itemMap = new Map((itemsRes.data ?? []).map((x) => [x.id as string, x]));
  const orderMap = new Map((ordersRes.data ?? []).map((x) => [x.id as string, x]));
  const testMap = new Map((testsRes.data ?? []).map((x) => [x.id as string, x.test_name as string]));
  const patientMap = new Map((patientsRes.data ?? []).map((x) => [x.id as string, x.full_name as string]));

  return (samplesRes.data ?? []).map((s) => {
    const item = itemMap.get(s.order_item_id as string);
    const order = item ? orderMap.get(item.order_id as string) : undefined;
    const patientName = order ? patientMap.get(order.patient_id as string) : undefined;
    const testName = item ? testMap.get(item.test_id as string) : undefined;

    return {
      id: s.id as string,
      sample_barcode: s.sample_barcode as string,
      status: s.status as string,
      collected_at: (s.collected_at as string | null) ?? null,
      received_at: (s.received_at as string | null) ?? null,
      order_no: (order?.order_no as string) ?? "-",
      patient_name: patientName ?? "-",
      test_name: testName ?? "-",
    };
  });
}

export async function updateSampleStatus(input: UpdateSampleStatusInput): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const patch: Record<string, unknown> = { status: input.status };
  if (input.status === "collected") {
    patch.collected_at = new Date().toISOString();
  }
  if (input.status === "received") {
    patch.received_at = new Date().toISOString();
  }

  const res = await supabase
    .from("samples")
    .update(patch)
    .eq("tenant_id", tenant.id)
    .eq("id", input.sample_id);

  if (res.error) {
    throw new Error(`Failed to update sample status: ${res.error.message}`);
  }
}
