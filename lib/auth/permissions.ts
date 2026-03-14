import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureProfileForUser, type AppProfile } from "@/lib/auth/profile";
import type { AppRole } from "@/lib/auth/roles";

export class AuthzError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type AuthContext = {
  userId: string;
  email: string | null;
  profile: AppProfile;
};

async function resolveAuthContext(): Promise<AuthContext> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthzError("Authentication required", 401);
  }

  const fullNameHint = typeof user.user_metadata?.full_name === "string" ? (user.user_metadata.full_name as string) : null;
  const roleHint = typeof user.user_metadata?.role === "string" ? (user.user_metadata.role as string) : null;

  const profile = await ensureProfileForUser({
    authUserId: user.id,
    email: user.email ?? null,
    fullNameHint,
    roleHint,
  });

  return {
    userId: user.id,
    email: user.email ?? null,
    profile,
  };
}

export async function requirePageRoles(allowedRoles: AppRole[]): Promise<AuthContext> {
  try {
    const ctx = await resolveAuthContext();
    if (!allowedRoles.includes(ctx.profile.role as AppRole)) {
      redirect("/forbidden");
    }
    return ctx;
  } catch (error) {
    if (error instanceof AuthzError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }
}

export async function requireApiRoles(allowedRoles: AppRole[]): Promise<AuthContext> {
  const ctx = await resolveAuthContext();
  if (!allowedRoles.includes(ctx.profile.role as AppRole)) {
    throw new AuthzError("Forbidden for this role", 403);
  }
  return ctx;
}
