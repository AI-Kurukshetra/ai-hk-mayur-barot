import { NextResponse } from "next/server";
import { AuthzError, requireApiRoles } from "@/lib/auth/permissions";
import { createPatient, listPatients } from "@/lib/patients/service";

const seedPatients = [
  { full_name: "Mayur Barot", sex: "male", dob: "1994-06-18", phone: "9876543210", email: "mayur@example.com", address: "Ahmedabad" },
  { full_name: "Riya Shah", sex: "female", dob: "1997-01-25", phone: "9898989898", email: "riya.shah@example.com", address: "Surat" },
  { full_name: "Karan Patel", sex: "male", dob: "1989-11-02", phone: "9811111111", email: "karan.patel@example.com", address: "Vadodara" },
  { full_name: "Neha Desai", sex: "female", dob: "1992-03-14", phone: "9822222222", email: "neha.desai@example.com", address: "Rajkot" },
  { full_name: "Aarav Mehta", sex: "male", dob: "2001-09-30", phone: "9833333333", email: "aarav.mehta@example.com", address: "Gandhinagar" },
] as const;

export async function POST() {
  try {
    await requireApiRoles(["tenant_admin"]);
    const existing = await listPatients();
    const names = new Set(existing.map((p) => p.full_name.toLowerCase()));

    let inserted = 0;
    for (const row of seedPatients) {
      if (names.has(row.full_name.toLowerCase())) {
        continue;
      }
      await createPatient({
        full_name: row.full_name,
        sex: row.sex,
        dob: row.dob,
        phone: row.phone,
        email: row.email,
        address: row.address,
      });
      inserted += 1;
    }

    const final = await listPatients();
    return NextResponse.json({ ok: true, inserted, total: final.length });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
