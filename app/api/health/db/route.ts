import { NextResponse } from "next/server";
import { AuthzError, requireApiRoles } from "@/lib/auth/permissions";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const adminRoles = ["tenant_admin"] as const;

export async function GET() {
  try {
    await requireApiRoles([...adminRoles]);
    const supabase = createAdminSupabaseClient();

    const [tenantsRes, profilesRes] = await Promise.all([
      supabase.from("tenants").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    if (tenantsRes.error || profilesRes.error) {
      return NextResponse.json(
        {
          ok: false,
          tenantsError: tenantsRes.error?.message ?? null,
          profilesError: profilesRes.error?.message ?? null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Database reachable.",
      counts: {
        tenants: tenantsRes.count ?? 0,
        profiles: profilesRes.count ?? 0,
      },
    });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
