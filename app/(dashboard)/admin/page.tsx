import { requirePageRoles } from "@/lib/auth/permissions";
import { listAdminRoles, listAdminUsers } from "@/lib/admin/users-service";
import { AdminUsersConsole } from "./_components/admin-users-console";

type SearchProps = { searchParams?: Promise<{ q?: string }> };

export default async function AdminPage({ searchParams }: SearchProps) {
  await requirePageRoles(["tenant_admin"]);
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").trim().toLowerCase();

  const [allUsers, roles] = await Promise.all([listAdminUsers(), listAdminRoles()]);
  const users = q
    ? allUsers.filter((u) => [u.full_name, u.email ?? "", u.role].join(" ").toLowerCase().includes(q))
    : allUsers;

  return (
    <section className="grid page-gap">
      <header className="section-head">
        <h2>Access management</h2>
      </header>

      <div className="stats-grid">
        <article className="stat-card"><p>Total Users</p><h3>{users.length}</h3></article>
        <article className="stat-card"><p>Roles</p><h3>{roles.length}</h3></article>
        <article className="stat-card"><p>Active Users</p><h3>{users.filter((u) => u.is_active).length}</h3></article>
        <article className="stat-card"><p>Admins</p><h3>{users.filter((u) => u.role === "tenant_admin").length}</h3></article>
      </div>

      <AdminUsersConsole initialUsers={users} roles={roles} />
    </section>
  );
}
