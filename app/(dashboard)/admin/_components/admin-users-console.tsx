"use client";

import { useMemo, useState } from "react";
import type { AdminRoleRow, AdminUserRow } from "@/lib/admin/users-service";
import { getApiMessage } from "@/lib/ui/form-feedback";
import { useDashboardUi } from "@/components/layout/dashboard-ui-context";

type Props = { initialUsers: AdminUserRow[]; roles: AdminRoleRow[] };

const DEFAULT_FORM = { full_name: "", email: "", role: "receptionist", password: "Test@123" };

export function AdminUsersConsole({ initialUsers, roles }: Props) {
  const { setBlocking } = useDashboardUi();
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc">("name_asc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const roleOptions = useMemo(() => roles, [roles]);
  const visibleUsers = useMemo(() => {
    const q = query.toLowerCase();
    let list = users.filter((u) => [u.full_name, u.email ?? "", u.role].join(" ").toLowerCase().includes(q));
    if (roleFilter !== "all") list = list.filter((u) => u.role === roleFilter);
    list = [...list].sort((a, b) => (sortBy === "name_asc" ? a.full_name.localeCompare(b.full_name) : b.full_name.localeCompare(a.full_name)));
    return list;
  }, [users, query, roleFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(visibleUsers.length / pageSize));
  const pageRows = useMemo(() => visibleUsers.slice((page - 1) * pageSize, page * pageSize), [visibleUsers, page, pageSize]);

  const onCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const e: Record<string, string> = {};
    if (form.full_name.trim().length < 2) e.full_name = "Full name must be at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Valid email is required.";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setCreating(true);
    setBlocking(true);
    try {
      const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok || !payload.ok) { setMessage(getApiMessage(payload, "Failed to create user.")); return; }
      setUsers((prev) => [payload.data as AdminUserRow, ...prev]);
      setForm(DEFAULT_FORM);
      setErrors({});
      setMessage("User created successfully.");
    } finally {
      setCreating(false);
      setBlocking(false);
    }
  };

  const onChangeRole = async (authUserId: string, role: string) => {
    setMessage(null);
    setUpdatingUser(authUserId);
    setBlocking(true);
    try {
      const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ auth_user_id: authUserId, role }) });
      const payload = await response.json();
      if (!response.ok || !payload.ok) { setMessage(getApiMessage(payload, "Failed to update role.")); return; }
      const updated = payload.data as AdminUserRow;
      setUsers((prev) => prev.map((user) => (user.auth_user_id === updated.auth_user_id ? updated : user)));
      setMessage("Role updated successfully.");
    } finally {
      setUpdatingUser(null);
      setBlocking(false);
    }
  };

  return (
    <div className="grid admin-grid">
      <section className="card panel">
        <h2>Create user</h2><p>Add a new login user and assign role in one step.</p>
        <form className="admin-form" onSubmit={onCreate} noValidate>
          <fieldset className={creating ? "form-loading" : ""} disabled={creating}>
            <label>Full Name<input value={form.full_name} onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))} />{errors.full_name ? <span className="field-error">{errors.full_name}</span> : null}</label>
            <label>Email<input type="text" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />{errors.email ? <span className="field-error">{errors.email}</span> : null}</label>
            <label>Role<select value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}>{roleOptions.map((role) => <option key={role.role} value={role.role}>{role.label}</option>)}</select></label>
            <label>Password<input type="text" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />{errors.password ? <span className="field-error">{errors.password}</span> : null}</label>
            <button className="button" type="submit" disabled={creating}>{creating ? "Creating..." : "Create User"}</button>
          </fieldset>
        </form>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>{creating ? <span className="inline-loader" /> : null}{message ? <p className="patients-message" style={{ margin: 0 }}>{message}</p> : null}</div>
      </section>

      <section className="card panel">
        <div className="patients-table-head"><h2>User access</h2><span className="badge">{visibleUsers.length} users</span></div>
        <div className="grid-toolbar"><input placeholder="Search user" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} /><select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}><option value="all">All Roles</option>{roleOptions.map((r) => <option key={r.role} value={r.role}>{r.label}</option>)}</select><select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}><option value="name_asc">Name A-Z</option><option value="name_desc">Name Z-A</option></select><select value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}><option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option></select></div>
        <div className="patients-table-wrap"><table className="patients-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Change Role</th></tr></thead><tbody>{pageRows.map((user) => <tr key={user.auth_user_id}><td>{user.full_name}</td><td>{user.email ?? "-"}</td><td><span className="role-pill">{user.role}</span></td><td>{user.is_active ? "Active" : "Inactive"}</td><td><select value={user.role} disabled={updatingUser === user.auth_user_id} onChange={(e) => onChangeRole(user.auth_user_id, e.target.value)}>{roleOptions.map((role) => <option key={role.role} value={role.role}>{role.label}</option>)}</select></td></tr>)}{pageRows.length === 0 ? <tr><td colSpan={5}>No users found.</td></tr> : null}</tbody></table></div>
        <div className="pagination"><span>Page {page} of {totalPages}</span><div className="pagination-controls"><button className="button button-secondary" type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button><button className="button button-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button></div></div>
      </section>
    </div>
  );
}
