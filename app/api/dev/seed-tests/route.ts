import { NextResponse } from "next/server";
import { AuthzError, requireApiRoles } from "@/lib/auth/permissions";
import { createTest, listTests } from "@/lib/tests/service";

const seeds = [
  { test_name: "Complete Blood Count", department: "Hematology", sample_type: "Blood", unit: "cells/uL", price: 450, tat_hours: 8 },
  { test_name: "Liver Function Test", department: "Biochemistry", sample_type: "Serum", unit: "U/L", price: 650, tat_hours: 12 },
  { test_name: "Kidney Function Test", department: "Biochemistry", sample_type: "Serum", unit: "mg/dL", price: 620, tat_hours: 12 },
  { test_name: "Thyroid Profile", department: "Immunology", sample_type: "Serum", unit: "uIU/mL", price: 900, tat_hours: 16 },
  { test_name: "HbA1c", department: "Biochemistry", sample_type: "Blood", unit: "%", price: 520, tat_hours: 10 },
] as const;

export async function POST() {
  try {
    await requireApiRoles(["tenant_admin"]);
    const existing = await listTests();
    const names = new Set(existing.map((t) => t.test_name.toLowerCase()));

    let inserted = 0;
    for (const row of seeds) {
      if (names.has(row.test_name.toLowerCase())) continue;
      await createTest({
        test_name: row.test_name,
        department: row.department,
        sample_type: row.sample_type,
        unit: row.unit,
        price: row.price,
        tat_hours: row.tat_hours,
      });
      inserted += 1;
    }

    const final = await listTests();
    return NextResponse.json({ ok: true, inserted, total: final.length });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
