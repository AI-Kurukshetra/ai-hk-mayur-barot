import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getOrCreateDefaultTenant } from "@/lib/core/tenant";

type EnsureProfileInput = {
  authUserId: string;
  email: string | null;
  fullNameHint?: string | null;
  roleHint?: string | null;
};

export type AppProfile = {
  id: string;
  auth_user_id: string;
  tenant_id: string;
  role: string;
  full_name: string;
};

function deriveNameFromEmail(email: string | null): string {
  if (!email) return "Lab User";
  const local = email.split("@")[0] ?? "Lab User";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Lab User";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const allowedSignupRoles = new Set([
  "receptionist",
  "phlebotomist",
  "technician",
  "pathologist",
  "finance",
]);

export async function ensureProfileForUser(input: EnsureProfileInput): Promise<AppProfile> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const existing = await supabase
    .from("profiles")
    .select("id, auth_user_id, tenant_id, role, full_name")
    .eq("auth_user_id", input.authUserId)
    .maybeSingle();

  if (existing.error) {
    throw new Error(`Failed to lookup profile: ${existing.error.message}`);
  }

  if (existing.data) {
    return existing.data as AppProfile;
  }

  const countRes = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  if (countRes.error) {
    throw new Error(`Failed to evaluate profile role: ${countRes.error.message}`);
  }

  const isFirstUser = (countRes.count ?? 0) === 0;
  const role =
    isFirstUser
      ? "tenant_admin"
      : allowedSignupRoles.has(String(input.roleHint ?? ""))
        ? String(input.roleHint)
        : "receptionist";

  const fullName =
    input.fullNameHint && input.fullNameHint.trim().length >= 2
      ? input.fullNameHint.trim()
      : deriveNameFromEmail(input.email);

  const created = await supabase
    .from("profiles")
    .insert({
      auth_user_id: input.authUserId,
      tenant_id: tenant.id,
      full_name: fullName,
      role,
      is_active: true,
    })
    .select("id, auth_user_id, tenant_id, role, full_name")
    .single();

  if (created.error || !created.data) {
    throw new Error(`Failed to create profile: ${created.error?.message ?? "Unknown error"}`);
  }

  return created.data as AppProfile;
}
