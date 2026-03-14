import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getOrCreateDefaultTenant } from "@/lib/core/tenant";
import type { CreateAdminUserInput, UpdateAdminUserRoleInput } from "@/lib/validations/admin-users";

export type AdminUserRow = {
  profile_id: string;
  auth_user_id: string;
  email: string | null;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  tenant_id: string;
};

export type AdminRoleRow = {
  role: string;
  label: string;
  description: string | null;
};

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const usersRes = await supabase
    .from("user_accounts")
    .select("profile_id, auth_user_id, email, full_name, role, is_active, created_at, tenant_id")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  if (usersRes.error) {
    throw new Error(`Failed to list users: ${usersRes.error.message}`);
  }

  return (usersRes.data ?? []) as AdminUserRow[];
}

export async function listAdminRoles(): Promise<AdminRoleRow[]> {
  const supabase = createAdminSupabaseClient();
  const rolesRes = await supabase
    .from("roles")
    .select("role, label, description")
    .in("role", ["tenant_admin", "receptionist", "phlebotomist", "technician", "pathologist", "finance"])
    .order("role", { ascending: true });

  if (rolesRes.error) {
    throw new Error(`Failed to list roles: ${rolesRes.error.message}`);
  }

  return (rolesRes.data ?? []) as AdminRoleRow[];
}

export async function createAdminUser(input: CreateAdminUserInput): Promise<AdminUserRow> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const created = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
      role: input.role,
    },
  });

  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Failed to create auth user");
  }

  const profileRes = await supabase
    .from("profiles")
    .insert({
      auth_user_id: created.data.user.id,
      tenant_id: tenant.id,
      full_name: input.full_name,
      role: input.role,
      is_active: true,
    })
    .select("id")
    .single();

  if (profileRes.error) {
    throw new Error(`Failed to create user profile: ${profileRes.error.message}`);
  }

  const rowRes = await supabase
    .from("user_accounts")
    .select("profile_id, auth_user_id, email, full_name, role, is_active, created_at, tenant_id")
    .eq("auth_user_id", created.data.user.id)
    .single();

  if (rowRes.error || !rowRes.data) {
    throw new Error(`Failed to resolve created user: ${rowRes.error?.message ?? "Unknown error"}`);
  }

  return rowRes.data as AdminUserRow;
}

export async function updateAdminUserRole(input: UpdateAdminUserRoleInput): Promise<AdminUserRow> {
  const supabase = createAdminSupabaseClient();
  const tenant = await getOrCreateDefaultTenant();

  const profileUpdate = await supabase
    .from("profiles")
    .update({ role: input.role })
    .eq("auth_user_id", input.auth_user_id)
    .eq("tenant_id", tenant.id)
    .select("auth_user_id")
    .single();

  if (profileUpdate.error || !profileUpdate.data) {
    throw new Error(`Failed to update profile role: ${profileUpdate.error?.message ?? "User not found"}`);
  }

  const currentUser = await supabase.auth.admin.getUserById(input.auth_user_id);
  if (currentUser.error || !currentUser.data.user) {
    throw new Error(currentUser.error?.message ?? "Failed to fetch auth user");
  }

  const mergedMetadata = {
    ...(currentUser.data.user.user_metadata ?? {}),
    role: input.role,
  };

  const authUpdate = await supabase.auth.admin.updateUserById(input.auth_user_id, {
    user_metadata: mergedMetadata,
  });

  if (authUpdate.error) {
    throw new Error(`Failed to update auth metadata role: ${authUpdate.error.message}`);
  }

  const rowRes = await supabase
    .from("user_accounts")
    .select("profile_id, auth_user_id, email, full_name, role, is_active, created_at, tenant_id")
    .eq("auth_user_id", input.auth_user_id)
    .single();

  if (rowRes.error || !rowRes.data) {
    throw new Error(`Failed to resolve updated user: ${rowRes.error?.message ?? "Unknown error"}`);
  }

  return rowRes.data as AdminUserRow;
}
