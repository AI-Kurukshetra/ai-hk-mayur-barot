import { NextResponse } from "next/server";
import { AuthzError, requireApiRoles } from "@/lib/auth/permissions";
import { listResultQueue, saveResult } from "@/lib/results/service";
import { saveResultSchema } from "@/lib/validations/results";

const resultRoles = ["tenant_admin", "technician", "pathologist"] as const;

export async function GET() {
  try {
    await requireApiRoles([...resultRoles]);
    const data = await listResultQueue();
    return NextResponse.json({ ok: true, data });
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
    await requireApiRoles([...resultRoles]);
    const raw = await request.json();
    const parsed = saveResultSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    await saveResult(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
