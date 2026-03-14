import { requirePageRoles } from "@/lib/auth/permissions";
import { listOrders } from "@/lib/orders/service";
import { listPatients } from "@/lib/patients/service";
import { listTests } from "@/lib/tests/service";
import { OrdersConsole } from "./_components/orders-console";

type SearchProps = { searchParams?: Promise<{ q?: string }> };

export default async function OrdersPage({ searchParams }: SearchProps) {
  await requirePageRoles(["tenant_admin", "receptionist"]);
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").trim().toLowerCase();

  const [allOrders, patients, tests] = await Promise.all([listOrders(), listPatients(), listTests()]);
  const orders = q
    ? allOrders.filter((o) =>
        [o.order_no, o.patient.full_name, o.patient.patient_code, o.status, o.priority].join(" ").toLowerCase().includes(q)
      )
    : allOrders;

  return (
    <section className="grid page-gap">
      <header className="section-head">
        <h2>Order desk</h2>
      </header>

      <div className="stats-grid">
        <article className="stat-card"><p>Total Orders</p><h3>{orders.length}</h3></article>
        <article className="stat-card"><p>Ordered Status</p><h3>{orders.filter((o) => o.status === "ordered").length}</h3></article>
        <article className="stat-card"><p>Total Value</p><h3>Rs {orders.reduce((sum, o) => sum + Number(o.total_amount), 0).toFixed(0)}</h3></article>
        <article className="stat-card"><p>Patients</p><h3>{patients.length}</h3></article>
      </div>

      <OrdersConsole initialOrders={orders} patients={patients} tests={tests} />
    </section>
  );
}
