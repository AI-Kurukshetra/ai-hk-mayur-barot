"use client";

import { useMemo, useState } from "react";
import type { TestRow } from "@/lib/tests/service";
import { getApiMessage } from "@/lib/ui/form-feedback";
import { useDashboardUi } from "@/components/layout/dashboard-ui-context";

type Props = { initialTests: TestRow[] };

const DEFAULT_FORM = { test_name: "", department: "", sample_type: "", unit: "", price: "", tat_hours: "" };

export function TestsConsole({ initialTests }: Props) {
  const { setBlocking } = useDashboardUi();
  const [tests, setTests] = useState<TestRow[]>(initialTests);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "price_desc">("name_asc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = tests.filter((t) => [t.test_code, t.test_name, t.department ?? "", t.sample_type ?? ""].join(" ").toLowerCase().includes(q));
    if (sortBy === "name_asc") rows = [...rows].sort((a, b) => a.test_name.localeCompare(b.test_name));
    if (sortBy === "name_desc") rows = [...rows].sort((a, b) => b.test_name.localeCompare(a.test_name));
    if (sortBy === "price_desc") rows = [...rows].sort((a, b) => Number(b.price) - Number(a.price));
    return rows;
  }, [tests, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.test_name.trim().length < 2) e.test_name = "Test name must be at least 2 characters.";
    if (form.department.trim().length < 2) e.department = "Department is required.";
    if (form.sample_type.trim().length < 2) e.sample_type = "Sample type is required.";
    if (Number(form.price) < 0) e.price = "Price cannot be negative.";
    if (Number(form.tat_hours) < 1) e.tat_hours = "TAT must be at least 1 hour.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!validate()) return;

    setSubmitting(true);
    setBlocking(true);
    try {
      const response = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price || 0), tat_hours: Number(form.tat_hours || 0) }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setMessage(getApiMessage(payload, "Failed to create test."));
        return;
      }
      setTests((prev) => [...prev, payload.data as TestRow]);
      setForm(DEFAULT_FORM);
      setErrors({});
      setMessage("Test created successfully.");
    } finally {
      setSubmitting(false);
      setBlocking(false);
    }
  };

  return (
    <div className="grid tests-grid">
      <section className="card panel">
        <h2>Create Test</h2>
        <p>Add test catalog entries to use in order creation.</p>
        <form className="patients-form" onSubmit={onSubmit} noValidate>
          <label>Test Name<input value={form.test_name} onChange={(e) => setForm((s) => ({ ...s, test_name: e.target.value }))} />{errors.test_name ? <span className="field-error">{errors.test_name}</span> : null}</label>
          <label>Department<input value={form.department} onChange={(e) => setForm((s) => ({ ...s, department: e.target.value }))} />{errors.department ? <span className="field-error">{errors.department}</span> : null}</label>
          <label>Sample Type<input value={form.sample_type} onChange={(e) => setForm((s) => ({ ...s, sample_type: e.target.value }))} />{errors.sample_type ? <span className="field-error">{errors.sample_type}</span> : null}</label>
          <label>Unit<input value={form.unit} onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))} /></label>
          <label>Price<input type="number" min="0" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} />{errors.price ? <span className="field-error">{errors.price}</span> : null}</label>
          <label>TAT (Hours)<input type="number" min="1" value={form.tat_hours} onChange={(e) => setForm((s) => ({ ...s, tat_hours: e.target.value }))} />{errors.tat_hours ? <span className="field-error">{errors.tat_hours}</span> : null}</label>
          <div className="field-span-2 patients-actions"><button className="button" type="submit" disabled={submitting}>{submitting ? "Saving..." : "Add Test"}</button>{submitting ? <span className="inline-loader" /> : null}{message ? <span className="patients-message">{message}</span> : null}</div>
        </form>
      </section>

      <section className="card panel">
        <div className="patients-table-head"><h2>Test Catalog</h2><span className="badge">{filtered.length} tests</span></div>
        <div className="grid-toolbar">
          <input placeholder="Search test" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}><option value="name_asc">Name A-Z</option><option value="name_desc">Name Z-A</option><option value="price_desc">Price High-Low</option></select>
          <select value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}><option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option></select>
        </div>
        <div className="patients-table-wrap">
          <table className="patients-table">
            <thead><tr><th>Code</th><th>Name</th><th>Department</th><th>Price</th><th>TAT</th></tr></thead>
            <tbody>
              {pageRows.map((test) => <tr key={test.id}><td>{test.test_code}</td><td>{test.test_name}</td><td>{test.department ?? "-"}</td><td>Rs {Number(test.price).toFixed(0)}</td><td>{test.tat_hours}h</td></tr>)}
              {pageRows.length === 0 ? <tr><td colSpan={5}>No tests found.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="pagination"><span>Page {page} of {totalPages}</span><div className="pagination-controls"><button className="button button-secondary" type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button><button className="button button-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button></div></div>
      </section>
    </div>
  );
}
