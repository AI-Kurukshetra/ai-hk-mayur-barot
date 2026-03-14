import { NextResponse } from "next/server";
import { AuthzError, requireApiRoles } from "@/lib/auth/permissions";
import { createOrderSchema } from "@/lib/validations/orders";
import { createOrder, listOrders } from "@/lib/orders/service";

const orderRoles = ["tenant_admin", "receptionist"] as const;

export async function GET() {
  try {
    await requireApiRoles([...orderRoles]);
    const orders = await listOrders();
    return NextResponse.json({ ok: true, data: orders });
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
    await requireApiRoles([...orderRoles]);
    const raw = await request.json();
    const parsed = createOrderSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const created = await createOrder(parsed.data);
    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
