import { NextResponse } from "next/server";
import { AuthzError, requireApiRoles } from "@/lib/auth/permissions";
import { createTestSchema } from "@/lib/validations/tests";
import { createTest, listTests } from "@/lib/tests/service";

const testRoles = ["tenant_admin", "technician", "pathologist"] as const;

export async function GET() {
  try {
    await requireApiRoles([...testRoles]);
    const tests = await listTests();
    return NextResponse.json({ ok: true, data: tests });
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
    await requireApiRoles([...testRoles]);
    const raw = await request.json();
    const parsed = createTestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const created = await createTest(parsed.data);
    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
