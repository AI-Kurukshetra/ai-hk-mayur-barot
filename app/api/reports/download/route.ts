import { NextResponse } from "next/server";
import { AuthzError, requireApiRoles } from "@/lib/auth/permissions";
import { getReportDownloadUrlByOrder } from "@/lib/reports/service";

const downloadRoles = ["tenant_admin", "pathologist", "finance"] as const;

export async function GET(request: Request) {
  try {
    await requireApiRoles([...downloadRoles]);
    const url = new URL(request.url);
    const orderId = url.searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ ok: false, message: "order_id is required" }, { status: 400 });
    }

    const data = await getReportDownloadUrlByOrder(orderId);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
