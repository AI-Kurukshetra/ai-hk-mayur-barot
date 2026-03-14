import OpenAI from "openai";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getOrCreateDefaultTenant } from "@/lib/core/tenant";

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

type Snapshot = {
  patientCount: number;
  testCount: number;
  orderCount: number;
  pendingSamples: number;
  pendingResults: number;
  releasedReports: number;
  totalBilled: number;
  totalCollected: number;
  recentPatients: Array<{ patient_code: string; full_name: string }>;
  recentOrders: Array<{ order_no: string; status: string; priority: string; patient_name: string }>;
  recentReports: Array<{ order_id: string; version_no: number; released_at: string | null }>;
};

function normalizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const role = (entry as { role?: string }).role;
      const content = (entry as { content?: string }).content;
      if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
      return { role, content: content.slice(0, 1200) };
    })
    .filter(Boolean)
    .slice(-10) as ChatMessage[];
}

function snapshotToText(snapshot: Snapshot): string {
  return [
    `Patients: ${snapshot.patientCount}`,
    `Tests: ${snapshot.testCount}`,
    `Orders: ${snapshot.orderCount}`,
    `Pending Samples: ${snapshot.pendingSamples}`,
    `Pending Results: ${snapshot.pendingResults}`,
    `Released Reports: ${snapshot.releasedReports}`,
    `Total Billed: ${snapshot.totalBilled.toFixed(2)}`,
    `Total Collected: ${snapshot.totalCollected.toFixed(2)}`,
    `Recent Patients: ${snapshot.recentPatients.map((p) => `${p.patient_code} ${p.full_name}`).join(" | ") || "-"}`,
    `Recent Orders: ${snapshot.recentOrders.map((o) => `${o.order_no} ${o.status} ${o.patient_name}`).join(" | ") || "-"}`,
  ].join("\n");
}

async function buildSnapshot(): Promise<Snapshot> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const [patientsRes, testsRes, ordersRes, samplesRes, orderItemsRes, reportsRes] = await Promise.all([
    supabase.from("patients").select("patient_code, full_name, created_at").eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("tests").select("id").eq("tenant_id", tenant.id),
    supabase
      .from("orders")
      .select("id, order_no, status, priority, total_amount, paid_amount, patient:patients!orders_patient_id_fkey(full_name), ordered_at")
      .eq("tenant_id", tenant.id)
      .order("ordered_at", { ascending: false })
      .limit(50),
    supabase.from("samples").select("status").eq("tenant_id", tenant.id).limit(500),
    supabase.from("order_items").select("result_status").eq("tenant_id", tenant.id).limit(800),
    supabase.from("reports").select("order_id, version_no, released_at").eq("tenant_id", tenant.id).order("released_at", { ascending: false }).limit(30),
  ]);

  if (patientsRes.error || testsRes.error || ordersRes.error || samplesRes.error || orderItemsRes.error || reportsRes.error) {
    throw new Error(
      patientsRes.error?.message ??
        testsRes.error?.message ??
        ordersRes.error?.message ??
        samplesRes.error?.message ??
        orderItemsRes.error?.message ??
        reportsRes.error?.message ??
        "Failed to build assistant context."
    );
  }

  const orders = ordersRes.data ?? [];
  const totalBilled = orders.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
  const totalCollected = orders.reduce((sum, row) => sum + Number(row.paid_amount ?? 0), 0);

  const pendingSamples = (samplesRes.data ?? []).filter((row) => String(row.status).includes("pending")).length;
  const pendingResults = (orderItemsRes.data ?? []).filter((row) => String(row.result_status) === "pending").length;

  return {
    patientCount: (patientsRes.data ?? []).length,
    testCount: (testsRes.data ?? []).length,
    orderCount: orders.length,
    pendingSamples,
    pendingResults,
    releasedReports: (reportsRes.data ?? []).length,
    totalBilled,
    totalCollected,
    recentPatients: (patientsRes.data ?? []).slice(0, 8).map((row) => ({
      patient_code: row.patient_code as string,
      full_name: row.full_name as string,
    })),
    recentOrders: orders.slice(0, 8).map((row) => {
      const patient = Array.isArray(row.patient) ? row.patient[0] : row.patient;
      return {
        order_no: row.order_no as string,
        status: row.status as string,
        priority: row.priority as string,
        patient_name: (patient?.full_name as string) ?? "-",
      };
    }),
    recentReports: (reportsRes.data ?? []).slice(0, 10).map((row) => ({
      order_id: row.order_id as string,
      version_no: Number(row.version_no ?? 0),
      released_at: (row.released_at as string | null) ?? null,
    })),
  };
}

function fallbackAnswer(question: string, snapshot: Snapshot): string {
  const q = question.toLowerCase();
  if (q.includes("patient")) return `Total patients: ${snapshot.patientCount}. Recent: ${snapshot.recentPatients.map((p) => p.full_name).join(", ") || "-"}.`;
  if (q.includes("order")) return `Total orders: ${snapshot.orderCount}. Recent statuses: ${snapshot.recentOrders.map((o) => `${o.order_no} (${o.status})`).join(", ") || "-"}.`;
  if (q.includes("report")) return `Released reports: ${snapshot.releasedReports}. Pending results: ${snapshot.pendingResults}.`;
  if (q.includes("billing") || q.includes("payment") || q.includes("revenue")) {
    return `Total billed: Rs ${snapshot.totalBilled.toFixed(0)}, total collected: Rs ${snapshot.totalCollected.toFixed(0)}.`;
  }
  return `Live summary: ${snapshot.patientCount} patients, ${snapshot.orderCount} orders, ${snapshot.releasedReports} released reports, pending samples ${snapshot.pendingSamples}, pending results ${snapshot.pendingResults}. Add OPENAI_API_KEY for advanced conversational answers.`;
}

export async function getAssistantAnswer(message: string, historyRaw: unknown): Promise<string> {
  const question = message.trim();
  if (!question) throw new Error("Message is required.");

  const snapshot = await buildSnapshot();
  const history = normalizeHistory(historyRaw);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallbackAnswer(question, snapshot);

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const systemPrompt =
    "You are an assistant for PathologyLab Pro. Answer briefly, clearly, and factually using provided live data context. If user asks something outside context, state assumption and suggest exact module/page to verify. Do not fabricate records.";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "system", content: `Live Data Snapshot:\n${snapshotToText(snapshot)}` },
      ...history.map((item) => ({ role: item.role, content: item.content })),
      { role: "user", content: question },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || fallbackAnswer(question, snapshot);
}
