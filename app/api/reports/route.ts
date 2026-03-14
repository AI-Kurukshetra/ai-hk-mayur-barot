import { NextResponse } from "next/server";
import { AuthzError, requireApiRoles } from "@/lib/auth/permissions";
import { listReportQueue, releaseOrderReport } from "@/lib/reports/service";
import { releaseReportSchema } from "@/lib/validations/reports";

const reportReadRoles = ["tenant_admin", "pathologist", "finance"] as const;
const reportReleaseRoles = ["tenant_admin", "pathologist"] as const;

export async function GET() {
  try {
    await requireApiRoles([...reportReadRoles]);
    const data = await listReportQueue();
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
    await requireApiRoles([...reportReleaseRoles]);
    const raw = await request.json();
    const parsed = releaseReportSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const released = await releaseOrderReport(parsed.data);
    return NextResponse.json({ ok: true, data: released });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
