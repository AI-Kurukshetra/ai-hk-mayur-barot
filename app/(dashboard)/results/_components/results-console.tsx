"use client";

import { useMemo, useState } from "react";
import type { ResultQueueRow } from "@/lib/results/service";
import { getApiMessage } from "@/lib/ui/form-feedback";
import { useDashboardUi } from "@/components/layout/dashboard-ui-context";

type Props = { initialRows: ResultQueueRow[] };

export function ResultsConsole({ initialRows }: Props) {
  const { setBlocking } = useDashboardUi();
  const [rows, setRows] = useState<ResultQueueRow[]>(initialRows);
  const [selectedId, setSelectedId] = useState<string>(initialRows[0]?.order_item_id ?? "");
  const [valueText, setValueText] = useState("");
  const [valueNumeric, setValueNumeric] = useState("");
  const [unit, setUnit] = useState("");
  const [flag, setFlag] = useState<"normal" | "high" | "low" | "critical">("normal");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"order_asc" | "order_desc">("order_desc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = rows.filter((r) => [r.order_no, r.patient_name, r.test_name, r.result_status].join(" ").toLowerCase().includes(q));
    if (statusFilter !== "all") list = list.filter((r) => r.result_status === statusFilter);
    list = [...list].sort((a, b) => (sortBy === "order_asc" ? a.order_no.localeCompare(b.order_no) : b.order_no.localeCompare(a.order_no)));
    return list;
  }, [rows, query, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);
  const selected = useMemo(() => rows.find((r) => r.order_item_id === selectedId), [rows, selectedId]);

  const onSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId) return;
    setMessage(null);
    if (valueNumeric.trim() === "" && valueText.trim() === "") {
      setMessage("Provide numeric or text result.");
      return;
    }

    setSaving(true);
    setBlocking(true);
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_item_id: selectedId,
          value_text: valueText,
          value_numeric: valueNumeric === "" ? undefined : Number(valueNumeric),
          unit,
          flag,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        setMessage(getApiMessage(payload, "Failed to save result."));
        return;
      }
      const refresh = await fetch("/api/results", { cache: "no-store" });
      const refreshPayload = await refresh.json();
      if (refresh.ok && refreshPayload.ok) setRows(refreshPayload.data as ResultQueueRow[]);
      setMessage("Result saved.");
    } finally {
      setSaving(false);
      setBlocking(false);
    }
  };

  return (
    <section className="grid page-gap">
      <div className="stats-grid">
        <article className="stat-card"><p>Total Queue</p><h3>{filtered.length}</h3></article>
        <article className="stat-card"><p>Pending</p><h3>{filtered.filter((r) => r.result_status === "pending").length}</h3></article>
        <article className="stat-card"><p>Entered</p><h3>{filtered.filter((r) => r.result_status === "entered").length}</h3></article>
        <article className="stat-card"><p>Critical</p><h3>{filtered.filter((r) => r.flag === "critical").length}</h3></article>
      </div>

      <div className="content-grid two-col">
        <section className="card panel">
          <h3 className="panel-title">Result Queue</h3>
          <div className="grid-toolbar">
            <input placeholder="Search queue" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="entered">Entered</option>
              <option value="reviewed">Reviewed</option>
              <option value="released">Released</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <option value="order_desc">Order Desc</option>
              <option value="order_asc">Order Asc</option>
            </select>
            <select value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </select>
          </div>

          <div className="patients-table-wrap">
            <table className="patients-table">
              <thead><tr><th>Order</th><th>Patient</th><th>Test</th><th>Status</th></tr></thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.order_item_id} onClick={() => setSelectedId(row.order_item_id)} style={{ cursor: "pointer", background: selectedId === row.order_item_id ? "#eff6ff" : "transparent" }}>
                    <td>{row.order_no}</td><td>{row.patient_name}</td><td>{row.test_name}</td><td><span className={`status-badge status-${row.result_status}`}>{row.result_status}</span></td>
                  </tr>
                ))}
                {pageRows.length === 0 ? <tr><td colSpan={4}>No results found.</td></tr> : null}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span>Page {page} of {totalPages}</span>
            <div className="pagination-controls">
              <button className="button button-secondary" type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
              <button className="button button-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </div>
        </section>

        <section className="card panel">
          <h3 className="panel-title">Result Entry</h3>
          <p style={{ marginTop: 0, marginBottom: 12, color: "#64748b" }}>{selected ? `${selected.order_no} - ${selected.test_name}` : "Select an item"}</p>
          <form className="orders-form" onSubmit={onSave} noValidate>
            <fieldset className={saving ? "form-loading" : ""} disabled={saving}>
              <label>Numeric Value<input type="number" step="0.01" value={valueNumeric} onChange={(e) => setValueNumeric(e.target.value)} /></label>
              <label>Unit<input value={unit} onChange={(e) => setUnit(e.target.value)} /></label>
              <label className="field-span-2">Text Value<input value={valueText} onChange={(e) => setValueText(e.target.value)} /></label>
              <label className="field-span-2">Flag<select value={flag} onChange={(e) => setFlag(e.target.value as "normal" | "high" | "low" | "critical")}><option value="normal">Normal</option><option value="high">High</option><option value="low">Low</option><option value="critical">Critical</option></select></label>
              <div className="field-span-2 patients-actions"><button className="button" disabled={saving || !selectedId} type="submit">{saving ? "Saving..." : "Save Result"}</button>{saving ? <span className="inline-loader" /> : null}{message ? <span className="patients-message">{message}</span> : null}</div>
            </fieldset>
          </form>
        </section>
      </div>
    </section>
  );
}
