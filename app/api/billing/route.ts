import { NextResponse } from "next/server";
import { AuthzError, requireApiRoles } from "@/lib/auth/permissions";
import { listBillingSnapshot, recordPayment } from "@/lib/billing/service";
import { createPaymentSchema } from "@/lib/validations/billing";

const billingRoles = ["tenant_admin", "receptionist", "finance"] as const;

export async function GET() {
  try {
    await requireApiRoles([...billingRoles]);
    const data = await listBillingSnapshot();
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
    await requireApiRoles([...billingRoles]);
    const raw = await request.json();
    const parsed = createPaymentSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = await recordPayment(parsed.data);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
