import { requirePageRoles } from "@/lib/auth/permissions";
import { listResultQueue } from "@/lib/results/service";
import { ResultsConsole } from "./_components/results-console";

type SearchProps = { searchParams?: Promise<{ q?: string }> };

export default async function ResultsPage({ searchParams }: SearchProps) {
  await requirePageRoles(["tenant_admin", "technician", "pathologist"]);
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").trim().toLowerCase();

  const allRows = await listResultQueue();
  const queue = q
    ? allRows.filter((r) =>
        [r.order_no, r.patient_name, r.test_name, r.result_status, r.value_text ?? ""].join(" ").toLowerCase().includes(q)
      )
    : allRows;

  return (
    <section className="grid page-gap">
      <header className="section-head">
        <h2>Result entry</h2>
      </header>
      <ResultsConsole initialRows={queue} />
    </section>
  );
}
