import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getOrCreateDefaultTenant } from "@/lib/core/tenant";
import type { CreateTestInput } from "@/lib/validations/tests";

export type TestRow = {
  id: string;
  test_code: string;
  test_name: string;
  department: string | null;
  sample_type: string | null;
  unit: string | null;
  price: number;
  tat_hours: number;
  is_active: boolean;
};

export async function listTests(): Promise<TestRow[]> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const { data, error } = await supabase
    .from("tests")
    .select("id, test_code, test_name, department, sample_type, unit, price, tat_hours, is_active")
    .eq("tenant_id", tenant.id)
    .order("test_name", { ascending: true })
    .limit(300);

  if (error) {
    throw new Error(`Failed to load tests: ${error.message}`);
  }

  return (data ?? []) as TestRow[];
}

export async function createTest(input: CreateTestInput): Promise<TestRow> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const { count, error: countError } = await supabase
    .from("tests")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  if (countError) {
    throw new Error(`Failed to generate test code: ${countError.message}`);
  }

  const testCode = `TST-${String((count ?? 0) + 1).padStart(4, "0")}`;
  const created = await supabase
    .from("tests")
    .insert({
      tenant_id: tenant.id,
      test_code: testCode,
      test_name: input.test_name,
      department: input.department,
      sample_type: input.sample_type,
      unit: input.unit || null,
      price: input.price,
      tat_hours: input.tat_hours,
      is_active: true,
    })
    .select("id, test_code, test_name, department, sample_type, unit, price, tat_hours, is_active")
    .single();

  if (created.error || !created.data) {
    throw new Error(`Failed to create test: ${created.error?.message ?? "Unknown error"}`);
  }

  return created.data as TestRow;
}
