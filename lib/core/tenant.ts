import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type TenantRow = {
  id: string;
  code: string;
};

export async function getOrCreateDefaultTenant(): Promise<TenantRow> {
  const supabase = createAdminSupabaseClient();
  const defaultCode = process.env.DEFAULT_TENANT_CODE ?? "DEFAULT";

  const found = await supabase
    .from("tenants")
    .select("id, code")
    .eq("code", defaultCode)
    .maybeSingle();

  if (found.error) {
    throw new Error(`Failed to resolve tenant: ${found.error.message}`);
  }

  if (found.data) {
    return found.data;
  }

  const created = await supabase
    .from("tenants")
    .insert({
      name: "Default Lab",
      code: defaultCode,
      timezone: "Asia/Kolkata",
      is_active: true,
    })
    .select("id, code")
    .single();

  if (created.error || !created.data) {
    throw new Error(`Failed to create tenant: ${created.error?.message ?? "Unknown error"}`);
  }

  return created.data;
}
