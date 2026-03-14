import { requirePageRoles } from "@/lib/auth/permissions";
import { listBillingSnapshot } from "@/lib/billing/service";
import { BillingConsole } from "./_components/billing-console";

type SearchProps = { searchParams?: Promise<{ q?: string }> };

export default async function BillingPage({ searchParams }: SearchProps) {
  await requirePageRoles(["tenant_admin", "receptionist", "finance"]);
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").trim().toLowerCase();

  const snapshot = await listBillingSnapshot();
  const filtered = q
    ? {
        orders: snapshot.orders.filter((o) => [o.order_no, o.patient_name, o.status].join(" ").toLowerCase().includes(q)),
        payments: snapshot.payments.filter((p) => [p.order_no, p.patient_name, p.mode, p.txn_ref ?? ""].join(" ").toLowerCase().includes(q)),
      }
    : snapshot;

  return (
    <section className="grid page-gap">
      <header className="section-head">
        <h2>Billing</h2>
      </header>
      <BillingConsole initialData={filtered} />
    </section>
  );
}
