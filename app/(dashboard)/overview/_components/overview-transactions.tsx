"use client";

import { useMemo, useState } from "react";
import type { OverviewPaymentRow } from "@/lib/overview/service";

type Props = { rows: OverviewPaymentRow[] };

export function OverviewTransactions({ rows }: Props) {
  const [query, setQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "amount_desc" | "amount_asc">("newest");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows.filter((row) =>
      [row.order_no, row.patient_name, row.referred_by, row.mode].join(" ").toLowerCase().includes(q)
    );
    if (modeFilter !== "all") {
      list = list.filter((row) => row.mode === modeFilter);
    }
    if (sortBy === "newest") list = [...list].sort((a, b) => b.paid_at.localeCompare(a.paid_at));
    if (sortBy === "amount_desc") list = [...list].sort((a, b) => b.amount - a.amount);
    if (sortBy === "amount_asc") list = [...list].sort((a, b) => a.amount - b.amount);
    return list;
  }, [rows, query, modeFilter, sortBy]);

  const modeOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.mode))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  return (
    <>
      <div className="grid-toolbar">
        <input
          placeholder="Search transaction"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        <select
          value={modeFilter}
          onChange={(event) => {
            setModeFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Modes</option>
          {modeOptions.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
          <option value="newest">Newest</option>
          <option value="amount_desc">Amount High-Low</option>
          <option value="amount_asc">Amount Low-High</option>
        </select>
        <select
          value={String(pageSize)}
          onChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(1);
          }}
        >
          <option value="10">10 / page</option>
          <option value="20">20 / page</option>
          <option value="50">50 / page</option>
        </select>
      </div>

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
            {pageRows.map((row) => (
              <tr key={row.id}>
                <td>{row.order_no}</td>
                <td>{row.patient_name}</td>
                <td>{row.referred_by}</td>
                <td>{new Date(row.paid_at).toLocaleDateString("en-IN")}</td>
                <td>Rs {row.amount.toFixed(0)}</td>
                <td><span className="mode-badge">{row.mode.replaceAll("_", " ")}</span></td>
              </tr>
            ))}
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={6}>No transactions available.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="pagination-controls">
          <button
            className="button button-secondary"
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Prev
          </button>
          <button
            className="button button-secondary"
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
