import { requirePageRoles } from "@/lib/auth/permissions";
import { getOverviewSnapshot } from "@/lib/overview/service";
import { OverviewTransactions } from "@/app/(dashboard)/overview/_components/overview-transactions";
import { OverviewCharts } from "@/app/(dashboard)/overview/_components/overview-charts";

const overviewRoles = [
  "super_admin",
  "tenant_admin",
  "receptionist",
  "phlebotomist",
  "technician",
  "pathologist",
  "finance",
] as const;

export default async function OverviewPage() {
  await requirePageRoles([...overviewRoles]);
  const snapshot = await getOverviewSnapshot();

  return (
    <section className="grid page-gap">
      <header className="section-head">
        <h2>Business Snapshot</h2>
      </header>

      <div className="stats-grid">
        <article className="stat-card">
          <p>Total Billed</p>
          <h3>Rs {snapshot.total_billed.toFixed(0)}</h3>
        </article>
        <article className="stat-card">
          <p>Total Collected</p>
          <h3>Rs {snapshot.total_collected.toFixed(0)}</h3>
        </article>
        <article className="stat-card">
          <p>Total Due</p>
          <h3>Rs {snapshot.total_due.toFixed(0)}</h3>
        </article>
        <article className="stat-card">
          <p>Total Orders</p>
          <h3>{snapshot.order_count}</h3>
        </article>
      </div>

      <div className="content-grid two-col">
        <section className="card panel">
          <h3 className="panel-title">Transactions</h3>
          <OverviewTransactions rows={snapshot.recent_payments} />
        </section>

        <section className="card panel">
          <h3 className="panel-title">Analytics</h3>
          <OverviewCharts rows={snapshot.recent_payments} />
        </section>
      </div>
    </section>
  );
}
