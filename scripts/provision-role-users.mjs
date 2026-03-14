import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const users = [
  { email: "admin@pathologylabpro.com", full_name: "Admin User", role: "tenant_admin" },
  { email: "reception@pathologylabpro.com", full_name: "Reception User", role: "receptionist" },
  { email: "collector@pathologylabpro.com", full_name: "Sample Collector", role: "phlebotomist" },
  { email: "technician@pathologylabpro.com", full_name: "Lab Technician", role: "technician" },
  { email: "pathologist@pathologylabpro.com", full_name: "Pathologist Doctor", role: "pathologist" },
  { email: "billing@pathologylabpro.com", full_name: "Billing Accounts", role: "finance" },
];

const PASSWORD = "Test@123";
const defaultTenantCode = process.env.DEFAULT_TENANT_CODE ?? "DEFAULT";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureTenant() {
  const found = await supabase.from("tenants").select("id, code").eq("code", defaultTenantCode).maybeSingle();
  if (found.error) throw new Error(found.error.message);
  if (found.data) return found.data;

  const created = await supabase
    .from("tenants")
    .insert({ name: "Default Lab", code: defaultTenantCode, timezone: "Asia/Kolkata", is_active: true })
    .select("id, code")
    .single();

  if (created.error || !created.data) throw new Error(created.error?.message ?? "Failed to create tenant");
  return created.data;
}

async function findUserIdByEmail(email) {
  const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error) throw new Error(listed.error.message);
  const user = (listed.data?.users ?? []).find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
  return user?.id ?? null;
}

async function ensureAuthUser(seed) {
  const created = await supabase.auth.admin.createUser({
    email: seed.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: seed.full_name,
      role: seed.role,
    },
  });

  if (!created.error && created.data.user) {
    return created.data.user.id;
  }

  if (created.error && /already|exists|registered/i.test(created.error.message)) {
    const existingId = await findUserIdByEmail(seed.email);
    if (!existingId) throw new Error(`Could not resolve existing auth user for ${seed.email}`);

    const update = await supabase.auth.admin.updateUserById(existingId, {
      password: PASSWORD,
      user_metadata: { full_name: seed.full_name, role: seed.role },
    });
    if (update.error) throw new Error(update.error.message);
    return existingId;
  }

  throw new Error(created.error?.message ?? `Failed to create auth user ${seed.email}`);
}

async function ensureProfile(userId, seed, tenantId) {
  const upsert = await supabase.from("profiles").upsert(
    {
      auth_user_id: userId,
      tenant_id: tenantId,
      full_name: seed.full_name,
      role: seed.role,
      is_active: true,
    },
    { onConflict: "auth_user_id" }
  );

  if (upsert.error) {
    throw new Error(upsert.error.message);
  }
}

const tenant = await ensureTenant();
const summary = [];

for (const seed of users) {
  const userId = await ensureAuthUser(seed);
  await ensureProfile(userId, seed, tenant.id);
  summary.push({ email: seed.email, role: seed.role, user_id: userId });
}

console.log("Provisioned users (password for all: Test@123)");
for (const row of summary) {
  console.log(`- ${row.email} | ${row.role} | ${row.user_id}`);
}
