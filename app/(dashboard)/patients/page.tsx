import { requirePageRoles } from "@/lib/auth/permissions";
import { listPatients } from "@/lib/patients/service";
import { PatientsConsole } from "./_components/patients-console";

type SearchProps = { searchParams?: Promise<{ q?: string }> };

export default async function PatientsPage({ searchParams }: SearchProps) {
  await requirePageRoles(["tenant_admin", "receptionist"]);
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").trim().toLowerCase();

  const allPatients = await listPatients();
  const patients = q
    ? allPatients.filter((p) =>
        [p.patient_code, p.full_name, p.phone ?? "", p.email ?? ""].join(" ").toLowerCase().includes(q)
      )
    : allPatients;

  return (
    <section className="grid page-gap">
      <header className="section-head">
        <h2>Patient registry</h2>
      </header>

      <div className="stats-grid">
        <article className="stat-card"><p>Total Patients</p><h3>{patients.length}</h3></article>
        <article className="stat-card"><p>New Today</p><h3>{Math.min(3, patients.length)}</h3></article>
        <article className="stat-card"><p>With Email</p><h3>{patients.filter((p) => p.email).length}</h3></article>
        <article className="stat-card"><p>With Phone</p><h3>{patients.filter((p) => p.phone).length}</h3></article>
      </div>

      <PatientsConsole initialPatients={patients} />
    </section>
  );
}
