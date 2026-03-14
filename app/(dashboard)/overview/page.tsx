import { requirePageRoles } from "@/lib/auth/permissions";
import { getOverviewSnapshot } from "@/lib/overview/service";

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
          <div className="table-wrap">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Reg No</th>
                  <th>Patient</th>
                  <th>Referred By</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Mode</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.recent_payments.map((row) => (
                  <tr key={row.id}>
                    <td>{row.order_no}</td>
                    <td>{row.patient_name}</td>
                    <td>{row.referred_by}</td>
                    <td>{new Date(row.paid_at).toLocaleDateString("en-IN")}</td>
                    <td>Rs {row.amount.toFixed(0)}</td>
                    <td>{row.mode}</td>
                  </tr>
                ))}
                {snapshot.recent_payments.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No transactions available.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card panel">
          <h3 className="panel-title">Actions</h3>
          <ul className="help-list">
            <li>Register patients and create new orders from the sidebar.</li>
            <li>Collect payments in Billing to update totals instantly.</li>
            <li>Release reports after all results are entered and reviewed.</li>
          </ul>
        </section>
      </div>
    </section>
  );
}
