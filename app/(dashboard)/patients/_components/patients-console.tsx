"use client";

import { useMemo, useState } from "react";
import type { PatientRow } from "@/lib/patients/service";
import { getApiMessage } from "@/lib/ui/form-feedback";
import { useDashboardUi } from "@/components/layout/dashboard-ui-context";

type Props = {
  initialPatients: PatientRow[];
};

const DEFAULT_FORM = {
  full_name: "",
  sex: "male",
  dob: "",
  phone: "",
  email: "",
  address: "",
};

export function PatientsConsole({ initialPatients }: Props) {
  const { setBlocking } = useDashboardUi();
  const [patients, setPatients] = useState<PatientRow[]>(initialPatients);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "name_asc" | "name_desc">("newest");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = patients.filter((p) => [p.patient_code, p.full_name, p.phone ?? "", p.email ?? ""].join(" ").toLowerCase().includes(q));
    if (sortBy === "name_asc") rows = [...rows].sort((a, b) => a.full_name.localeCompare(b.full_name));
    if (sortBy === "name_desc") rows = [...rows].sort((a, b) => b.full_name.localeCompare(a.full_name));
    if (sortBy === "newest") rows = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return rows;
  }, [patients, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.full_name.trim().length < 2) e.full_name = "Full name must be at least 2 characters.";
    if (form.phone.trim() && !/^\d{10,15}$/.test(form.phone.trim())) e.phone = "Phone should be 10 to 15 digits.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email address.";
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
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setMessage(getApiMessage(payload, "Failed to create patient."));
        return;
      }
      setPatients((prev) => [payload.data as PatientRow, ...prev]);
      setForm(DEFAULT_FORM);
      setErrors({});
      setMessage("Patient registered successfully.");
    } finally {
      setSubmitting(false);
      setBlocking(false);
    }
  };

  return (
    <div className="grid patients-grid">
      <section className="card panel">
        <h2>Quick Registration</h2>
        <p>Create real patient entries directly in Supabase.</p>

        <form className="patients-form" onSubmit={onSubmit} noValidate>
          <label>Full Name
            <input value={form.full_name} onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))} />
            {errors.full_name ? <span className="field-error">{errors.full_name}</span> : null}
          </label>

          <label>Sex
            <select value={form.sex} onChange={(e) => setForm((s) => ({ ...s, sex: e.target.value as "male" | "female" | "other" }))}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label>Date of Birth
            <input type="date" value={form.dob} onChange={(e) => setForm((s) => ({ ...s, dob: e.target.value }))} />
          </label>

          <label>Phone
            <input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
            {errors.phone ? <span className="field-error">{errors.phone}</span> : null}
          </label>

          <label>Email
            <input type="text" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
            {errors.email ? <span className="field-error">{errors.email}</span> : null}
          </label>

          <label className="field-span-2">Address
            <textarea rows={3} value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
          </label>

          <div className="field-span-2 patients-actions">
            <button className="button" type="submit" disabled={submitting}>{submitting ? "Saving..." : "Add Patient"}</button>
            {submitting ? <span className="inline-loader" /> : null}
            {message ? <span className="patients-message">{message}</span> : null}
          </div>
        </form>
      </section>

      <section className="card panel">
        <div className="patients-table-head"><h2>Patient Registry</h2><span className="badge">{filtered.length} records</span></div>
        <div className="grid-toolbar">
          <input placeholder="Search patient" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="newest">Newest</option><option value="name_asc">Name A-Z</option><option value="name_desc">Name Z-A</option>
          </select>
          <select value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
            <option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option>
          </select>
        </div>

        <div className="patients-table-wrap">
          <table className="patients-table">
            <thead><tr><th>Code</th><th>Name</th><th>Sex</th><th>DOB</th><th>Phone</th></tr></thead>
            <tbody>
              {pageRows.map((patient) => (
                <tr key={patient.id}><td>{patient.patient_code}</td><td>{patient.full_name}</td><td>{patient.sex ?? "-"}</td><td>{patient.dob ?? "-"}</td><td>{patient.phone ?? "-"}</td></tr>
              ))}
              {pageRows.length === 0 ? <tr><td colSpan={5}>No patients found.</td></tr> : null}
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
    </div>
  );
}
