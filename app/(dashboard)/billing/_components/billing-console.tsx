"use client";

import { useMemo, useState } from "react";
import type { BillingSnapshot } from "@/lib/billing/service";
import { getApiMessage } from "@/lib/ui/form-feedback";
import { useDashboardUi } from "@/components/layout/dashboard-ui-context";

type Props = { initialData: BillingSnapshot };

export function BillingConsole({ initialData }: Props) {
  const { setBlocking } = useDashboardUi();
  const [data, setData] = useState<BillingSnapshot>(initialData);
  const [orderId, setOrderId] = useState<string>(initialData.orders[0]?.order_id ?? "");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"cash" | "card" | "upi" | "net_banking" | "insurance">("cash");
  const [txnRef, setTxnRef] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "amount_desc">("newest");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const visiblePayments = useMemo(() => {
    const q = query.toLowerCase();
    let rows = data.payments.filter((p) => [p.order_no, p.patient_name, p.mode, p.txn_ref ?? ""].join(" ").toLowerCase().includes(q));
    rows = [...rows].sort((a, b) => (sortBy === "newest" ? b.paid_at.localeCompare(a.paid_at) : b.amount - a.amount));
    return rows;
  }, [data.payments, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(visiblePayments.length / pageSize));
  const pageRows = useMemo(() => visiblePayments.slice((page - 1) * pageSize, page * pageSize), [visiblePayments, page, pageSize]);

  const totals = useMemo(() => {
    const billed = data.orders.reduce((sum, o) => sum + o.total_amount, 0);
    const collected = data.orders.reduce((sum, o) => sum + o.paid_amount, 0);
    return { billed, collected, due: Math.max(0, billed - collected) };
  }, [data.orders]);

  const onRecord = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const parsed = Number(amount);
    if (!orderId) return setMessage("Please select an order.");
    if (!Number.isFinite(parsed) || parsed <= 0) return setMessage("Amount should be greater than zero.");

    setSaving(true);
    setBlocking(true);
    try {
      const res = await fetch("/api/billing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: orderId, amount: parsed, mode, txn_ref: txnRef }) });
      const payload = await res.json();
      if (!res.ok || !payload.ok) { setMessage(getApiMessage(payload, "Failed to record payment.")); return; }
      const refresh = await fetch("/api/billing", { cache: "no-store" });
      const refreshPayload = await refresh.json();
      if (refresh.ok && refreshPayload.ok) setData(refreshPayload.data as BillingSnapshot);
      setAmount(""); setTxnRef(""); setMessage("Payment recorded.");
    } finally {
      setSaving(false);
      setBlocking(false);
    }
  };

  return (
    <section className="grid page-gap">
      <div className="stats-grid"><article className="stat-card"><p>Total Billed</p><h3>Rs {totals.billed.toFixed(0)}</h3></article><article className="stat-card"><p>Total Collected</p><h3>Rs {totals.collected.toFixed(0)}</h3></article><article className="stat-card"><p>Total Due</p><h3>Rs {totals.due.toFixed(0)}</h3></article><article className="stat-card"><p>Payments</p><h3>{visiblePayments.length}</h3></article></div>
      <div className="content-grid two-col">
        <section className="card panel">
          <h3 className="panel-title">Record Payment</h3>
          <form className="orders-form" onSubmit={onRecord} noValidate>
            <fieldset className={saving ? "form-loading" : ""} disabled={saving}>
              <label className="field-span-2">Order<select value={orderId} onChange={(e) => setOrderId(e.target.value)}><option value="">Select order</option>{data.orders.map((order) => <option key={order.order_id} value={order.order_id}>{order.order_no} - {order.patient_name} (Due Rs {order.due_amount.toFixed(0)})</option>)}</select></label>
              <label>Amount<input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
              <label>Mode<select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}><option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="net_banking">Net Banking</option><option value="insurance">Insurance</option></select></label>
              <label className="field-span-2">Transaction Reference<input value={txnRef} onChange={(e) => setTxnRef(e.target.value)} /></label>
              <div className="field-span-2 patients-actions"><button className="button" disabled={saving} type="submit">{saving ? "Saving..." : "Record Payment"}</button>{saving ? <span className="inline-loader" /> : null}{message ? <span className="patients-message">{message}</span> : null}</div>
            </fieldset>
          </form>
        </section>

        <section className="card panel">
          <h3 className="panel-title">Recent Payments</h3>
          <div className="grid-toolbar"><input placeholder="Search payments" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} /><select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}><option value="newest">Newest</option><option value="amount_desc">Amount High-Low</option></select><select value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}><option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option></select></div>
          <div className="patients-table-wrap"><table className="patients-table"><thead><tr><th>Order</th><th>Patient</th><th>Amount</th><th>Mode</th><th>Txn Ref</th></tr></thead><tbody>{pageRows.map((payment) => <tr key={payment.id}><td>{payment.order_no}</td><td>{payment.patient_name}</td><td>Rs {payment.amount.toFixed(0)}</td><td><span className="mode-badge">{payment.mode.replaceAll("_", " ")}</span></td><td>{payment.txn_ref ?? "-"}</td></tr>)}{pageRows.length === 0 ? <tr><td colSpan={5}>No payments found.</td></tr> : null}</tbody></table></div>
          <div className="pagination"><span>Page {page} of {totalPages}</span><div className="pagination-controls"><button className="button button-secondary" type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button><button className="button button-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button></div></div>
        </section>
      </div>
    </section>
  );
}
