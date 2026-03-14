"use client";

import { useMemo, useState } from "react";
import type { ReportQueueRow } from "@/lib/reports/service";
import { getApiMessage } from "@/lib/ui/form-feedback";
import { useDashboardUi } from "@/components/layout/dashboard-ui-context";

type Props = { initialRows: ReportQueueRow[] };

export function ReportsConsole({ initialRows }: Props) {
  const { setBlocking } = useDashboardUi();
  const [rows, setRows] = useState<ReportQueueRow[]>(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"order_desc" | "order_asc">("order_desc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = rows.filter((r) => [r.order_no, r.patient_name, r.status].join(" ").toLowerCase().includes(q));
    if (status !== "all") list = list.filter((r) => r.status === status);
    list = [...list].sort((a, b) => (sortBy === "order_asc" ? a.order_no.localeCompare(b.order_no) : b.order_no.localeCompare(a.order_no)));
    return list;
  }, [rows, query, status, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const refreshRows = async () => {
    const refresh = await fetch("/api/reports", { cache: "no-store" });
    const refreshPayload = await refresh.json();
    if (refresh.ok && refreshPayload.ok) setRows(refreshPayload.data as ReportQueueRow[]);
  };

  const onRelease = async (orderId: string) => {
    setBusyId(orderId); setMessage(null); setBlocking(true);
    try {
      const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: orderId }) });
      const payload = await res.json();
      if (!res.ok || !payload.ok) { setMessage(getApiMessage(payload, "Failed to release report.")); return; }
      await refreshRows();
      setMessage(`Report released. Version ${payload.data.version_no}`);
    } finally { setBusyId(null); setBlocking(false); }
  };

  const onDownload = async (orderId: string) => {
    setBusyId(orderId); setMessage(null); setBlocking(true);
    try {
      const res = await fetch(`/api/reports/download?order_id=${orderId}`);
      const payload = await res.json();
      if (!res.ok || !payload.ok) { setMessage(getApiMessage(payload, "Failed to generate report link.")); return; }
      window.open(payload.data.download_url, "_blank", "noopener,noreferrer");
    } finally { setBusyId(null); setBlocking(false); }
  };

  return (
    <section className="grid page-gap">
      <div className="stats-grid"><article className="stat-card"><p>Total Orders</p><h3>{filtered.length}</h3></article><article className="stat-card"><p>Releasable</p><h3>{filtered.filter((r) => r.total_items > 0 && r.entered_items === r.total_items).length}</h3></article><article className="stat-card"><p>Released</p><h3>{filtered.filter((r) => r.released_versions > 0).length}</h3></article><article className="stat-card"><p>Pending</p><h3>{Math.max(0, filtered.length - filtered.filter((r) => r.released_versions > 0).length)}</h3></article></div>
      <section className="card panel">
        <div className="patients-table-head"><h3 className="panel-title">Report Release Queue</h3>{message ? <span className="patients-message">{message}</span> : null}</div>
        <div className="grid-toolbar"><input placeholder="Search report" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} /><select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="all">All Status</option><option value="ordered">Ordered</option><option value="released">Released</option></select><select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}><option value="order_desc">Order Desc</option><option value="order_asc">Order Asc</option></select><select value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}><option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option></select></div>
        <div className="patients-table-wrap"><table className="patients-table"><thead><tr><th>Order</th><th>Patient</th><th>Results</th><th>Versions</th><th>Status</th><th>Action</th></tr></thead><tbody>{pageRows.map((row) => { const canRelease = row.total_items > 0 && row.entered_items === row.total_items; const canDownload = row.released_versions > 0; return <tr key={row.order_id}><td>{row.order_no}</td><td>{row.patient_name}</td><td>{row.entered_items}/{row.total_items}</td><td>{row.released_versions}</td><td><span className={`status-badge status-${row.status}`}>{row.status}</span></td><td><div style={{ display: "flex", gap: 6 }}><button className="button" disabled={!canRelease || busyId === row.order_id} onClick={() => onRelease(row.order_id)}>Release</button><button className="button button-secondary" disabled={!canDownload || busyId === row.order_id} onClick={() => onDownload(row.order_id)}>Download</button></div></td></tr>; })}{pageRows.length === 0 ? <tr><td colSpan={6}>No reports found.</td></tr> : null}</tbody></table></div>
        <div className="pagination"><span>Page {page} of {totalPages}</span><div className="pagination-controls"><button className="button button-secondary" type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button><button className="button button-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button></div></div>
      </section>
    </section>
  );
}
