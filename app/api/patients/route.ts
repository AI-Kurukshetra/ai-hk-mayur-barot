import { NextResponse } from "next/server";
import { AuthzError, requireApiRoles } from "@/lib/auth/permissions";
import { createPatientSchema } from "@/lib/validations/patients";
import { createPatient, listPatients } from "@/lib/patients/service";

const patientRoles = ["tenant_admin", "receptionist"] as const;

export async function GET() {
  try {
    await requireApiRoles([...patientRoles]);
    const patients = await listPatients();
    return NextResponse.json({ ok: true, data: patients });
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
    await requireApiRoles([...patientRoles]);
    const raw = await request.json();
    const parsed = createPatientSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = await createPatient(parsed.data);
    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
