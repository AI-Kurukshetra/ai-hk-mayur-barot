import { NextResponse } from "next/server";
import { AuthzError, requireApiRoles } from "@/lib/auth/permissions";
import { listSamples, updateSampleStatus } from "@/lib/samples/service";
import { updateSampleStatusSchema } from "@/lib/validations/samples";

const sampleRoles = ["tenant_admin", "phlebotomist", "technician"] as const;

export async function GET() {
  try {
    await requireApiRoles([...sampleRoles]);
    const data = await listSamples();
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
    await requireApiRoles([...sampleRoles]);
    const raw = await request.json();
    const parsed = updateSampleStatusSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    await updateSampleStatus(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
