import { requirePageRoles } from "@/lib/auth/permissions";

const overviewRoles = [
  "super_admin",
  "tenant_admin",
  "receptionist",
  "phlebotomist",
  "technician",
  "pathologist",
  "finance",
] as const;

const cards = [
  { label: "Total Income", value: "Rs 2,21,250" },
  { label: "Collection Charges", value: "Rs 0" },
  { label: "Expenses", value: "Rs 0" },
  { label: "Net Income", value: "Rs 2,21,250" },
];

const rows = [
  ["#1203", "Rosie", "Self", "09/06/2025", "Rs 2,600", "Cash"],
  ["#1202", "Saran", "Dr. Lalitha", "09/06/2025", "Rs 2,600", "Cash"],
  ["#1201", "Lara", "Dr. Uday M", "09/06/2025", "Rs 1,550", "Cash"],
  ["#1200", "Everette", "Dr. Lalitha", "09/06/2025", "Rs 2,700", "Cash"],
];

export default async function OverviewPage() {
  await requirePageRoles([...overviewRoles]);

  return (
    <section className="grid page-gap">
      <header className="section-head">
        <h2>Daily business</h2>
      </header>

      <div className="stats-grid">
        {cards.map((card) => (
          <article key={card.label} className="stat-card">
            <p>{card.label}</p>
            <h3>{card.value}</h3>
          </article>
        ))}
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
                {rows.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell) => <td key={cell}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card panel">
          <h3 className="panel-title">Help</h3>
          <ul className="help-list">
            <li>How total income is calculated?</li>
            <li>How collection charges work?</li>
            <li>How transaction page works?</li>
          </ul>
        </section>
      </div>
    </section>
  );
}
