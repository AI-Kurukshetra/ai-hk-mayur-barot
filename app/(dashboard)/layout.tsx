import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requirePageRoles } from "@/lib/auth/permissions";

const dashboardRoles = [
  "super_admin",
  "tenant_admin",
  "receptionist",
  "phlebotomist",
  "technician",
  "pathologist",
  "finance",
] as const;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await requirePageRoles([...dashboardRoles]);

  return (
    <DashboardShell
      userEmail={auth.email ?? "authenticated-user"}
      userRole={auth.profile.role}
    >
      {children}
    </DashboardShell>
  );
}
