"use client";

import { useMemo, useState } from "react";
import type { PatientRow } from "@/lib/patients/service";
import type { TestRow } from "@/lib/tests/service";
import type { OrderRow } from "@/lib/orders/service";
import { getApiMessage } from "@/lib/ui/form-feedback";
import { useDashboardUi } from "@/components/layout/dashboard-ui-context";

type Props = { patients: PatientRow[]; tests: TestRow[]; initialOrders: OrderRow[] };

export function OrdersConsole({ patients, tests, initialOrders }: Props) {
  const { setBlocking } = useDashboardUi();
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [selectedPatient, setSelectedPatient] = useState<string>(patients[0]?.id ?? "");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [priority, setPriority] = useState<"normal" | "urgent" | "stat">("normal");
  const [doctor, setDoctor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "amount_desc">("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const selectedTotal = useMemo(() => tests.filter((t) => selectedTests.includes(t.id)).reduce((sum, t) => sum + Number(t.price ?? 0), 0), [selectedTests, tests]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = orders.filter((o) => [o.order_no, o.patient.full_name, o.patient.patient_code, o.status, o.priority].join(" ").toLowerCase().includes(q));
    if (statusFilter !== "all") rows = rows.filter((o) => o.status === statusFilter);
    if (sortBy === "newest") rows = [...rows].sort((a, b) => b.ordered_at.localeCompare(a.ordered_at));
    if (sortBy === "amount_desc") rows = [...rows].sort((a, b) => Number(b.total_amount) - Number(a.total_amount));
    return rows;
  }, [orders, query, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const toggleTest = (id: string) => setSelectedTests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const onCreateOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const e: Record<string, string> = {};
    if (!selectedPatient) e.patient = "Please select patient.";
    if (selectedTests.length === 0) e.tests = "Select at least one test.";
    setFormErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    setBlocking(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: selectedPatient, test_ids: selectedTests, priority, referring_doctor: doctor }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setMessage(getApiMessage(payload, "Failed to create order."));
        return;
      }
      const refresh = await fetch("/api/orders", { cache: "no-store" });
      const refreshPayload = await refresh.json();
      if (refresh.ok && refreshPayload.ok) setOrders(refreshPayload.data as OrderRow[]);
      setSelectedTests([]);
      setDoctor("");
      setPriority("normal");
      setMessage(`Order ${payload.data.order_no} created.`);
    } finally {
      setSubmitting(false);
      setBlocking(false);
    }
  };

  return (
    <div className="grid orders-grid">
      <section className="card panel">
        <h2>Create Order</h2>
        <p>Select patient and tests to generate a real accession order.</p>
        <form className="orders-form" onSubmit={onCreateOrder} noValidate>
          <label>Patient
            <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)}>
              <option value="">Select patient</option>
              {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.patient_code} - {patient.full_name}</option>)}
            </select>
            {formErrors.patient ? <span className="field-error">{formErrors.patient}</span> : null}
          </label>
          <label>Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value as "normal" | "urgent" | "stat") }>
              <option value="normal">Normal</option><option value="urgent">Urgent</option><option value="stat">STAT</option>
            </select>
          </label>
          <label className="field-span-2">Referring Doctor<input value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="Optional" /></label>
          <div className="field-span-2 tests-picker">
            {tests.map((test) => {
              const active = selectedTests.includes(test.id);
              return <button key={test.id} type="button" className={active ? "test-chip test-chip-active" : "test-chip"} onClick={() => toggleTest(test.id)}><span>{test.test_name}</span><small>Rs {Number(test.price).toFixed(0)}</small></button>;
            })}
          </div>
          {formErrors.tests ? <span className="field-error field-span-2">{formErrors.tests}</span> : null}
          <div className="field-span-2 orders-summary"><span>{selectedTests.length} tests selected</span><strong>Estimated Total: Rs {selectedTotal.toFixed(0)}</strong></div>
          <div className="field-span-2 patients-actions"><button className="button" type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Order"}</button>{submitting ? <span className="inline-loader" /> : null}{message ? <span className="patients-message">{message}</span> : null}</div>
        </form>
      </section>

      <section className="card panel">
        <div className="patients-table-head"><h2>Recent Orders</h2><span className="badge">{filtered.length} orders</span></div>
        <div className="grid-toolbar">
          <input placeholder="Search order" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}><option value="newest">Newest</option><option value="amount_desc">Amount High-Low</option></select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}><option value="all">All Status</option><option value="ordered">Ordered</option><option value="collected">Collected</option><option value="processing">Processing</option><option value="reviewed">Reviewed</option><option value="released">Released</option></select>
          <select value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}><option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option></select>
        </div>
        <div className="patients-table-wrap">
          <table className="patients-table"><thead><tr><th>Order No</th><th>Patient</th><th>Priority</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>
            {pageRows.map((order) => <tr key={order.id}><td>{order.order_no}</td><td>{order.patient.patient_code} - {order.patient.full_name}</td><td><span className={`priority-badge priority-${order.priority}`}>{order.priority}</span></td><td>{order.item_count}</td><td>Rs {Number(order.total_amount).toFixed(0)}</td><td><span className={`status-badge status-${order.status}`}>{order.status}</span></td></tr>)}
            {pageRows.length === 0 ? <tr><td colSpan={6}>No orders found.</td></tr> : null}
          </tbody></table>
        </div>
        <div className="pagination"><span>Page {page} of {totalPages}</span><div className="pagination-controls"><button className="button button-secondary" type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button><button className="button button-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button></div></div>
      </section>
    </div>
  );
}
