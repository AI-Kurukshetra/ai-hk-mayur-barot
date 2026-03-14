import { requirePageRoles } from "@/lib/auth/permissions";
import { listReportQueue } from "@/lib/reports/service";
import { ReportsConsole } from "./_components/reports-console";

type SearchProps = { searchParams?: Promise<{ q?: string }> };

export default async function ReportsPage({ searchParams }: SearchProps) {
  await requirePageRoles(["tenant_admin", "pathologist", "finance"]);
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").trim().toLowerCase();

  const allRows = await listReportQueue();
  const rows = q
    ? allRows.filter((r) => [r.order_no, r.patient_name, r.status].join(" ").toLowerCase().includes(q))
    : allRows;

  return (
    <section className="grid page-gap">
      <header className="section-head">
        <h2>Reports</h2>
      </header>
      <ReportsConsole initialRows={rows} />
    </section>
  );
}
