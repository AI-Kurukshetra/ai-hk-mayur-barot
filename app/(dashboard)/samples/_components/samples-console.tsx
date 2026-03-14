"use client";

import { useMemo, useState } from "react";
import type { SampleRow } from "@/lib/samples/service";
import { getApiMessage } from "@/lib/ui/form-feedback";
import { useDashboardUi } from "@/components/layout/dashboard-ui-context";

type Props = { initialSamples: SampleRow[] };

export function SamplesConsole({ initialSamples }: Props) {
  const { setBlocking } = useDashboardUi();
  const [samples, setSamples] = useState<SampleRow[]>(initialSamples);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "barcode_asc">("newest");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = samples.filter((s) => [s.sample_barcode, s.order_no, s.patient_name, s.test_name, s.status].join(" ").toLowerCase().includes(q));
    if (status !== "all") rows = rows.filter((s) => s.status === status);
    rows = [...rows].sort((a, b) => (sortBy === "barcode_asc" ? a.sample_barcode.localeCompare(b.sample_barcode) : b.sample_barcode.localeCompare(a.sample_barcode)));
    return rows;
  }, [samples, query, status, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const updateStatus = async (sampleId: string, nextStatus: string) => {
    setBusyId(sampleId);
    setMessage(null);
    setBlocking(true);
    try {
      const res = await fetch("/api/samples", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sample_id: sampleId, status: nextStatus }) });
      const payload = await res.json();
      if (!res.ok || !payload.ok) { setMessage(getApiMessage(payload, "Failed to update status.")); return; }
      const refresh = await fetch("/api/samples", { cache: "no-store" });
      const refreshPayload = await refresh.json();
      if (refresh.ok && refreshPayload.ok) setSamples(refreshPayload.data as SampleRow[]);
      setMessage("Sample status updated.");
    } finally {
      setBusyId(null);
      setBlocking(false);
    }
  };

  return (
    <section className="grid page-gap">
      <div className="stats-grid">
        <article className="stat-card"><p>Total Samples</p><h3>{filtered.length}</h3></article>
        <article className="stat-card"><p>Pending Collection</p><h3>{filtered.filter((s) => s.status === "pending_collection").length}</h3></article>
        <article className="stat-card"><p>Collected</p><h3>{filtered.filter((s) => s.status === "collected").length}</h3></article>
        <article className="stat-card"><p>Received</p><h3>{filtered.filter((s) => s.status === "received").length}</h3></article>
      </div>
      <section className="card panel">
        <div className="patients-table-head"><h3 className="panel-title">Sample Queue</h3>{message ? <span className="patients-message">{message}</span> : null}</div>
        <div className="grid-toolbar"><input placeholder="Search sample" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} /><select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="all">All Status</option><option value="pending_collection">Pending</option><option value="collected">Collected</option><option value="received">Received</option></select><select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}><option value="newest">Newest</option><option value="barcode_asc">Barcode A-Z</option></select><select value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}><option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option></select></div>
        <div className="patients-table-wrap"><table className="patients-table"><thead><tr><th>Barcode</th><th>Order</th><th>Patient</th><th>Test</th><th>Status</th><th>Action</th></tr></thead><tbody>{pageRows.map((sample) => <tr key={sample.id}><td>{sample.sample_barcode}</td><td>{sample.order_no}</td><td>{sample.patient_name}</td><td>{sample.test_name}</td><td>{sample.status}</td><td><div style={{ display: "flex", gap: 6 }}><button className="button" disabled={busyId === sample.id || sample.status !== "pending_collection"} onClick={() => updateStatus(sample.id, "collected")}>Collect</button><button className="button button-secondary" disabled={busyId === sample.id || sample.status === "received"} onClick={() => updateStatus(sample.id, "received")}>Receive</button></div></td></tr>)}{pageRows.length === 0 ? <tr><td colSpan={6}>No samples found.</td></tr> : null}</tbody></table></div>
        <div className="pagination"><span>Page {page} of {totalPages}</span><div className="pagination-controls"><button className="button button-secondary" type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button><button className="button button-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button></div></div>
      </section>
    </section>
  );
}
