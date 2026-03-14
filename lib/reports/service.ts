import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getOrCreateDefaultTenant } from "@/lib/core/tenant";
import type { ReleaseReportInput } from "@/lib/validations/reports";
import { buildReportPdf } from "@/lib/reports/pdf";

const REPORT_BUCKET = "reports";

export type ReportQueueRow = {
  order_id: string;
  order_no: string;
  patient_name: string;
  total_items: number;
  entered_items: number;
  status: string;
  released_versions: number;
  latest_report_path: string | null;
};

function calculateAgeLabel(dob: string | null): string {
  if (!dob) return "-";
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "-";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age < 0 ? "-" : `${age} YRS`;
}

async function ensureReportBucket() {
  const supabase = createAdminSupabaseClient();
  const bucketsRes = await supabase.storage.listBuckets();

  if (bucketsRes.error) {
    throw new Error(`Failed to inspect storage buckets: ${bucketsRes.error.message}`);
  }

  const exists = (bucketsRes.data ?? []).some((b) => b.name === REPORT_BUCKET);
  if (exists) return;

  const createRes = await supabase.storage.createBucket(REPORT_BUCKET, { public: false, fileSizeLimit: 5 * 1024 * 1024 });
  if (createRes.error) {
    throw new Error(`Failed to create reports bucket: ${createRes.error.message}`);
  }
}

export async function listReportQueue(): Promise<ReportQueueRow[]> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const ordersRes = await supabase
    .from("orders")
    .select("id, order_no, status, patient:patients!orders_patient_id_fkey(full_name)")
    .eq("tenant_id", tenant.id)
    .order("ordered_at", { ascending: false })
    .limit(200);

  if (ordersRes.error) {
    throw new Error(`Failed to load report queue orders: ${ordersRes.error.message}`);
  }

  const orderIds = (ordersRes.data ?? []).map((o) => o.id as string);
  if (orderIds.length === 0) return [];

  const [itemsRes, reportsRes] = await Promise.all([
    supabase.from("order_items").select("order_id, result_status").eq("tenant_id", tenant.id).in("order_id", orderIds),
    supabase.from("reports").select("order_id, version_no, storage_path").eq("tenant_id", tenant.id).in("order_id", orderIds),
  ]);

  if (itemsRes.error || reportsRes.error) {
    throw new Error(`Failed to load report metadata: ${itemsRes.error?.message ?? reportsRes.error?.message}`);
  }

  const itemStats = new Map<string, { total: number; entered: number }>();
  for (const item of itemsRes.data ?? []) {
    const key = item.order_id as string;
    const stat = itemStats.get(key) ?? { total: 0, entered: 0 };
    stat.total += 1;
    if (["entered", "reviewed", "released"].includes(String(item.result_status))) {
      stat.entered += 1;
    }
    itemStats.set(key, stat);
  }

  const reportStats = new Map<string, { versions: number; latestVersion: number; path: string | null }>();
  for (const rep of reportsRes.data ?? []) {
    const key = rep.order_id as string;
    const current = reportStats.get(key) ?? { versions: 0, latestVersion: 0, path: null };
    const version = Number(rep.version_no ?? 0);
    current.versions += 1;
    if (version >= current.latestVersion) {
      current.latestVersion = version;
      current.path = (rep.storage_path as string) ?? null;
    }
    reportStats.set(key, current);
  }

  return (ordersRes.data ?? []).map((order) => {
    const orderId = order.id as string;
    const stats = itemStats.get(orderId) ?? { total: 0, entered: 0 };
    const rep = reportStats.get(orderId) ?? { versions: 0, latestVersion: 0, path: null };
    const patient = Array.isArray(order.patient) ? order.patient[0] : order.patient;

    return {
      order_id: orderId,
      order_no: order.order_no as string,
      patient_name: (patient?.full_name as string) ?? "-",
      total_items: stats.total,
      entered_items: stats.entered,
      status: order.status as string,
      released_versions: rep.versions,
      latest_report_path: rep.path,
    };
  });
}

export async function releaseOrderReport(input: ReleaseReportInput): Promise<{ report_id: string; version_no: number; storage_path: string }> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const orderRes = await supabase
    .from("orders")
    .select("id, order_no, ordered_at, collected_at, released_at, referring_doctor, patient:patients!orders_patient_id_fkey(full_name, patient_code, dob, sex, address)")
    .eq("tenant_id", tenant.id)
    .eq("id", input.order_id)
    .maybeSingle();

  if (orderRes.error || !orderRes.data) {
    throw new Error("Order not found.");
  }

  const itemsRes = await supabase
    .from("order_items")
    .select("id, result_status, test_id")
    .eq("tenant_id", tenant.id)
    .eq("order_id", input.order_id);

  if (itemsRes.error || !itemsRes.data || itemsRes.data.length === 0) {
    throw new Error("No tests found in order.");
  }

  const releasable = itemsRes.data.every((item) => ["entered", "reviewed", "released"].includes(String(item.result_status)));
  if (!releasable) {
    throw new Error("All order items must have entered results before release.");
  }

  const itemIds = itemsRes.data.map((x) => x.id as string);
  const testIds = Array.from(new Set(itemsRes.data.map((x) => x.test_id as string)));

  const [resultsRes, testsRes] = await Promise.all([
    supabase.from("results").select("order_item_id, value_text, value_numeric, unit, flag").eq("tenant_id", tenant.id).in("order_item_id", itemIds),
    supabase.from("tests").select("id, test_name").eq("tenant_id", tenant.id).in("id", testIds),
  ]);

  if (resultsRes.error || testsRes.error) {
    throw new Error(`Failed to load report data: ${resultsRes.error?.message ?? testsRes.error?.message}`);
  }

  const reportsRes = await supabase
    .from("reports")
    .select("version_no")
    .eq("tenant_id", tenant.id)
    .eq("order_id", input.order_id)
    .order("version_no", { ascending: false })
    .limit(1);

  if (reportsRes.error) {
    throw new Error(`Failed to inspect previous reports: ${reportsRes.error.message}`);
  }

  const nextVersion = Number(reportsRes.data?.[0]?.version_no ?? 0) + 1;
  const path = `tenant-${tenant.id}/reports/${orderRes.data.order_no}/v${nextVersion}.pdf`;

  const testNameMap = new Map((testsRes.data ?? []).map((t) => [t.id as string, t.test_name as string]));
  const resultMap = new Map((resultsRes.data ?? []).map((r) => [r.order_item_id as string, r]));

  const reportItems = itemsRes.data.map((item) => {
    const result = resultMap.get(item.id as string);
    return {
      test_name: testNameMap.get(item.test_id as string) ?? "Unknown Test",
      value_text: (result?.value_text as string | null) ?? null,
      value_numeric: (result?.value_numeric as number | null) ?? null,
      unit: (result?.unit as string | null) ?? null,
      flag: (result?.flag as string | null) ?? null,
    };
  });

  const patient = Array.isArray(orderRes.data.patient) ? orderRes.data.patient[0] : orderRes.data.patient;
  const pdfBytes = await buildReportPdf({
    lab_name: "PathologyLab Pro",
    lab_phone: "+91 90000 00000",
    lab_email: "info@pathologylabpro.com",
    order_no: orderRes.data.order_no as string,
    patient_code: (patient?.patient_code as string) ?? "-",
    patient_name: (patient?.full_name as string) ?? "-",
    patient_age: calculateAgeLabel((patient?.dob as string | null) ?? null),
    patient_sex: ((patient?.sex as string | null) ?? "-").toUpperCase(),
    referring_doctor: (orderRes.data.referring_doctor as string | null) ?? "Self",
    patient_address: (patient?.address as string | null) ?? "-",
    registered_at_iso: (orderRes.data.ordered_at as string) ?? new Date().toISOString(),
    collected_at_iso: (orderRes.data.collected_at as string | null) ?? (orderRes.data.ordered_at as string) ?? new Date().toISOString(),
    released_at_iso: (orderRes.data.released_at as string | null) ?? new Date().toISOString(),
    generated_at_iso: new Date().toISOString(),
    items: reportItems,
  });

  await ensureReportBucket();

  const uploadRes = await supabase.storage.from(REPORT_BUCKET).upload(path, pdfBytes, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (uploadRes.error) {
    throw new Error(`Failed to upload report PDF: ${uploadRes.error.message}`);
  }

  const insertRes = await supabase
    .from("reports")
    .insert({
      tenant_id: tenant.id,
      order_id: input.order_id,
      version_no: nextVersion,
      storage_path: path,
      released_at: new Date().toISOString(),
      generated_at: new Date().toISOString(),
    })
    .select("id, version_no, storage_path")
    .single();

  if (insertRes.error || !insertRes.data) {
    throw new Error(`Failed to create report version: ${insertRes.error?.message ?? "Unknown error"}`);
  }

  const [orderUpdateRes, itemsUpdateRes] = await Promise.all([
    supabase.from("orders").update({ status: "released", released_at: new Date().toISOString() }).eq("tenant_id", tenant.id).eq("id", input.order_id),
    supabase.from("order_items").update({ status: "released", result_status: "released" }).eq("tenant_id", tenant.id).eq("order_id", input.order_id),
  ]);

  if (orderUpdateRes.error || itemsUpdateRes.error) {
    throw new Error(`Failed to finalize release: ${orderUpdateRes.error?.message ?? itemsUpdateRes.error?.message}`);
  }

  return {
    report_id: insertRes.data.id as string,
    version_no: Number(insertRes.data.version_no),
    storage_path: insertRes.data.storage_path as string,
  };
}

export async function getReportDownloadUrlByOrder(orderId: string): Promise<{ path: string; download_url: string }> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const reportRes = await supabase
    .from("reports")
    .select("storage_path, version_no")
    .eq("tenant_id", tenant.id)
    .eq("order_id", orderId)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reportRes.error || !reportRes.data?.storage_path) {
    throw new Error("No released report available for this order.");
  }

  const path = reportRes.data.storage_path as string;
  let signedRes = await supabase.storage.from(REPORT_BUCKET).createSignedUrl(path, 60 * 10);

  if (signedRes.error && String(signedRes.error.message).toLowerCase().includes("object not found")) {
    const orderRes = await supabase
      .from("orders")
      .select("order_no, ordered_at, collected_at, released_at, referring_doctor, patient:patients!orders_patient_id_fkey(full_name, patient_code, dob, sex, address)")
      .eq("tenant_id", tenant.id)
      .eq("id", orderId)
      .maybeSingle();

    if (orderRes.error || !orderRes.data) {
      throw new Error("Order metadata missing for report regeneration.");
    }

    const itemsRes = await supabase
      .from("order_items")
      .select("id, test_id")
      .eq("tenant_id", tenant.id)
      .eq("order_id", orderId);

    if (itemsRes.error || !itemsRes.data || itemsRes.data.length === 0) {
      throw new Error("Order items missing for report regeneration.");
    }

    const itemIds = itemsRes.data.map((i) => i.id as string);
    const testIds = Array.from(new Set(itemsRes.data.map((i) => i.test_id as string)));

    const [resultsRes, testsRes] = await Promise.all([
      supabase.from("results").select("order_item_id, value_text, value_numeric, unit, flag").eq("tenant_id", tenant.id).in("order_item_id", itemIds),
      supabase.from("tests").select("id, test_name").eq("tenant_id", tenant.id).in("id", testIds),
    ]);

    if (resultsRes.error || testsRes.error) {
      throw new Error(`Failed to regenerate report data: ${resultsRes.error?.message ?? testsRes.error?.message}`);
    }

    const testNameMap = new Map((testsRes.data ?? []).map((t) => [t.id as string, t.test_name as string]));
    const resultMap = new Map((resultsRes.data ?? []).map((r) => [r.order_item_id as string, r]));

    const reportItems = itemsRes.data.map((item) => {
      const result = resultMap.get(item.id as string);
      return {
        test_name: testNameMap.get(item.test_id as string) ?? "Unknown Test",
        value_text: (result?.value_text as string | null) ?? null,
        value_numeric: (result?.value_numeric as number | null) ?? null,
        unit: (result?.unit as string | null) ?? null,
        flag: (result?.flag as string | null) ?? null,
      };
    });

    const patient = Array.isArray(orderRes.data.patient) ? orderRes.data.patient[0] : orderRes.data.patient;
    const pdfBytes = await buildReportPdf({
      lab_name: "PathologyLab Pro",
      lab_phone: "+91 90000 00000",
      lab_email: "info@pathologylabpro.com",
      order_no: orderRes.data.order_no as string,
      patient_code: (patient?.patient_code as string) ?? "-",
      patient_name: (patient?.full_name as string) ?? "-",
      patient_age: calculateAgeLabel((patient?.dob as string | null) ?? null),
      patient_sex: ((patient?.sex as string | null) ?? "-").toUpperCase(),
      referring_doctor: (orderRes.data.referring_doctor as string | null) ?? "Self",
      patient_address: (patient?.address as string | null) ?? "-",
      registered_at_iso: (orderRes.data.ordered_at as string) ?? new Date().toISOString(),
      collected_at_iso: (orderRes.data.collected_at as string | null) ?? (orderRes.data.ordered_at as string) ?? new Date().toISOString(),
      released_at_iso: (orderRes.data.released_at as string | null) ?? new Date().toISOString(),
      generated_at_iso: new Date().toISOString(),
      items: reportItems,
    });

    await ensureReportBucket();
    const uploadRes = await supabase.storage.from(REPORT_BUCKET).upload(path, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

    if (uploadRes.error) {
      throw new Error(`Failed to regenerate missing report file: ${uploadRes.error.message}`);
    }

    signedRes = await supabase.storage.from(REPORT_BUCKET).createSignedUrl(path, 60 * 10);
  }

  if (signedRes.error || !signedRes.data?.signedUrl) {
    throw new Error(`Failed to generate download URL: ${signedRes.error?.message ?? "Unknown error"}`);
  }

  return { path, download_url: signedRes.data.signedUrl };
}
