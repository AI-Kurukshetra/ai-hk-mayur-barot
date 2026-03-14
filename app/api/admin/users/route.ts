import { NextResponse } from "next/server";
import { AuthzError, requireApiRoles } from "@/lib/auth/permissions";
import { createAdminUser, listAdminRoles, listAdminUsers, updateAdminUserRole } from "@/lib/admin/users-service";
import { createAdminUserSchema, updateAdminUserRoleSchema } from "@/lib/validations/admin-users";

const adminRoles = ["tenant_admin"] as const;

export async function GET() {
  try {
    await requireApiRoles([...adminRoles]);
    const [users, roles] = await Promise.all([listAdminUsers(), listAdminRoles()]);
    return NextResponse.json({ ok: true, data: { users, roles } });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireApiRoles([...adminRoles]);
    const raw = await request.json();
    const parsed = createAdminUserSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = await createAdminUser(parsed.data);
    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireApiRoles([...adminRoles]);
    const raw = await request.json();
    const parsed = updateAdminUserRoleSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateAdminUserRole(parsed.data);
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
