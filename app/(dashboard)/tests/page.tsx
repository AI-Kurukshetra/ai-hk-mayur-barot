import { requirePageRoles } from "@/lib/auth/permissions";
import { listTests } from "@/lib/tests/service";
import { TestsConsole } from "./_components/tests-console";

type SearchProps = { searchParams?: Promise<{ q?: string }> };

export default async function TestsPage({ searchParams }: SearchProps) {
  await requirePageRoles(["tenant_admin", "technician", "pathologist"]);
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").trim().toLowerCase();

  const allTests = await listTests();
  const tests = q
    ? allTests.filter((t) =>
        [t.test_code, t.test_name, t.department ?? "", t.sample_type ?? ""].join(" ").toLowerCase().includes(q)
      )
    : allTests;

  return (
    <section className="grid page-gap">
      <header className="section-head">
        <h2>Lab test catalog</h2>
      </header>

      <div className="stats-grid">
        <article className="stat-card"><p>Total Tests</p><h3>{tests.length}</h3></article>
        <article className="stat-card"><p>Avg Price</p><h3>Rs {tests.length ? Math.round(tests.reduce((s, t) => s + Number(t.price), 0) / tests.length) : 0}</h3></article>
        <article className="stat-card"><p>Biochemistry</p><h3>{tests.filter((t) => t.department?.toLowerCase().includes("bio")).length}</h3></article>
        <article className="stat-card"><p>Active</p><h3>{tests.filter((t) => t.is_active).length}</h3></article>
      </div>

      <TestsConsole initialTests={tests} />
    </section>
  );
}
