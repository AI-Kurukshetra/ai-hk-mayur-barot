"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { signOutAction } from "@/lib/auth/actions";
import type { AppRole } from "@/lib/auth/roles";
import { DashboardUiProvider, useDashboardUi } from "@/components/layout/dashboard-ui-context";
import {
  IconBell,
  IconClipboard,
  IconDashboard,
  IconFlask,
  IconPlus,
  IconPulse,
  IconReport,
  IconSettings,
  IconTube,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";

type QuickTest = { id: string; test_name: string; price: number };

const navItems: Array<{
  href: Route;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  roles: AppRole[];
}> = [
  {
    href: "/overview",
    label: "Dashboard",
    icon: IconDashboard,
    roles: ["super_admin", "tenant_admin", "receptionist", "phlebotomist", "technician", "pathologist", "finance"],
  },
  { href: "/patients", label: "Patients", icon: IconUsers, roles: ["tenant_admin", "receptionist"] },
  { href: "/tests", label: "Lab Tests", icon: IconFlask, roles: ["tenant_admin", "technician", "pathologist"] },
  { href: "/orders", label: "Orders", icon: IconClipboard, roles: ["tenant_admin", "receptionist"] },
  { href: "/samples", label: "Samples", icon: IconTube, roles: ["tenant_admin", "phlebotomist", "technician"] },
  { href: "/results", label: "Results", icon: IconPulse, roles: ["tenant_admin", "technician", "pathologist"] },
  { href: "/reports", label: "Reports", icon: IconReport, roles: ["tenant_admin", "pathologist", "finance"] },
  { href: "/billing", label: "Billing", icon: IconWallet, roles: ["tenant_admin", "receptionist", "finance"] },
  { href: "/admin", label: "Manage", icon: IconSettings, roles: ["tenant_admin"] },
];

const roleLabel: Record<AppRole, string> = {
  super_admin: "Super Admin",
  tenant_admin: "Admin",
  receptionist: "Receptionist",
  phlebotomist: "Sample Collection",
  technician: "Lab Technician",
  pathologist: "Pathologist",
  finance: "Billing",
  patient_portal: "Patient",
};

function DashboardShellInner({
  children,
  userEmail,
  userRole,
}: {
  children: React.ReactNode;
  userEmail: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isBlocking, setBlocking } = useDashboardUi();

  const safeRole = (userRole in roleLabel ? userRole : "receptionist") as AppRole;
  const visibleNav = navItems.filter((item) => item.roles.includes(safeRole));

  const [openNewCase, setOpenNewCase] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [tests, setTests] = useState<QuickTest[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

  const [patient, setPatient] = useState({
    full_name: "",
    sex: "male",
    dob: "",
    phone: "",
    email: "",
    address: "",
  });
  const [order, setOrder] = useState({ priority: "normal", referring_doctor: "", test_ids: [] as string[] });
  const [patientErrors, setPatientErrors] = useState<Record<string, string>>({});
  const [orderErrors, setOrderErrors] = useState<Record<string, string>>({});
  const [newCaseMessage, setNewCaseMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!openNewCase) return;
    let active = true;
    const run = async () => {
      setLoadingTests(true);
      const res = await fetch("/api/tests", { cache: "no-store" });
      const payload = await res.json();
      if (active && res.ok && payload?.ok) {
        setTests((payload.data ?? []).map((t: { id: string; test_name: string; price: number }) => ({
          id: t.id,
          test_name: t.test_name,
          price: Number(t.price ?? 0),
        })));
      }
      setLoadingTests(false);
    };
    run();
    return () => {
      active = false;
    };
  }, [openNewCase]);

  const total = useMemo(
    () => tests.filter((t) => order.test_ids.includes(t.id)).reduce((sum, t) => sum + Number(t.price || 0), 0),
    [order.test_ids, tests]
  );

  const validatePatientStep = () => {
    const errs: Record<string, string> = {};
    if (patient.full_name.trim().length < 2) errs.full_name = "Full name must be at least 2 characters.";
    if (patient.phone.trim() && !/^\d{10,15}$/.test(patient.phone.trim())) errs.phone = "Phone should be 10 to 15 digits.";
    if (patient.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email.trim())) errs.email = "Enter a valid email address.";
    setPatientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateOrderStep = () => {
    const errs: Record<string, string> = {};
    if (order.test_ids.length === 0) errs.test_ids = "Select at least one test.";
    setOrderErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitNewCase = async () => {
    setNewCaseMessage(null);
    if (!validateOrderStep()) return;

    try {
      setBlocking(true);
      const pRes = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patient),
      });
      const pPayload = await pRes.json();
      if (!pRes.ok || !pPayload?.ok) {
        setNewCaseMessage(pPayload?.message ?? "Failed to create patient.");
        return;
      }

      const oRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: pPayload.data.id,
          test_ids: order.test_ids,
          priority: order.priority,
          referring_doctor: order.referring_doctor,
        }),
      });
      const oPayload = await oRes.json();
      if (!oRes.ok || !oPayload?.ok) {
        setNewCaseMessage(oPayload?.message ?? "Failed to create order.");
        return;
      }

      setNewCaseMessage(`Case created successfully. Order ${oPayload.data.order_no}`);
      setOpenNewCase(false);
      router.push("/orders");
      router.refresh();
    } finally {
      setBlocking(false);
    }
  };

  const startNewCase = () => {
    setOpenNewCase(true);
    setStep(1);
    setNewCaseMessage(null);
    setPatientErrors({});
    setOrderErrors({});
  };

  const goStep2 = () => {
    if (!validatePatientStep()) return;
    setStep(2);
  };

  const toggleTest = (id: string) => {
    setOrder((prev) => ({
      ...prev,
      test_ids: prev.test_ids.includes(id) ? prev.test_ids.filter((x) => x !== id) : [...prev.test_ids, id],
    }));
  };

  return (
    <div className="app-wrap">
      <div className="dashboard-frame">
        <aside className="dashboard-sidebar modern-sidebar">
          <div className="brand-top">
            <img src="/microscope.png" alt="PathologyLab Pro" className="brand-logo-img" />
            <div>
              <p className="brand-pill">PathologyLab Pro</p>
              <p className="sidebar-label">{roleLabel[safeRole]}</p>
            </div>
          </div>

          <button className="new-case-btn" type="button" onClick={startNewCase}>
            <IconPlus width={14} height={14} />
            New case
          </button>

          <nav className="dashboard-nav modern-nav">
            {visibleNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={active ? "nav-item nav-item-active" : "nav-item"}>
                  <Icon width={16} height={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="dashboard-main">
          <header className="modern-header">
            <div className="header-title">
              <strong>{visibleNav.find((n) => n.href === pathname)?.label ?? "Workspace"}</strong>
            </div>

            <div className="top-actions">
              <button className="icon-btn" type="button" aria-label="Notifications">
                <IconBell width={16} height={16} />
              </button>
              <span className="user-email">{userEmail}</span>
              <form action={signOutAction}>
                <button className="button button-secondary" type="submit">Sign out</button>
              </form>
            </div>
          </header>

          <section className="dashboard-content">{children}</section>
        </main>
      </div>

      {openNewCase ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <h3>New Case</h3>
              <button className="icon-btn" onClick={() => setOpenNewCase(false)} type="button">x</button>
            </div>

            {step === 1 ? (
              <div className="modal-form">
                <label>Full Name<input value={patient.full_name} onChange={(e) => setPatient((s) => ({ ...s, full_name: e.target.value }))} /></label>
                {patientErrors.full_name ? <p className="field-error">{patientErrors.full_name}</p> : null}
                <label>Sex
                  <select value={patient.sex} onChange={(e) => setPatient((s) => ({ ...s, sex: e.target.value }))}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label>DOB<input type="date" value={patient.dob} onChange={(e) => setPatient((s) => ({ ...s, dob: e.target.value }))} /></label>
                <label>Phone<input value={patient.phone} onChange={(e) => setPatient((s) => ({ ...s, phone: e.target.value }))} /></label>
                {patientErrors.phone ? <p className="field-error">{patientErrors.phone}</p> : null}
                <label>Email<input value={patient.email} onChange={(e) => setPatient((s) => ({ ...s, email: e.target.value }))} /></label>
                {patientErrors.email ? <p className="field-error">{patientErrors.email}</p> : null}
                <label>Address<textarea rows={2} value={patient.address} onChange={(e) => setPatient((s) => ({ ...s, address: e.target.value }))} /></label>
                <div className="modal-actions"><button className="button" type="button" onClick={goStep2}>Next: Order</button></div>
              </div>
            ) : (
              <div className="modal-form">
                <label>Priority
                  <select value={order.priority} onChange={(e) => setOrder((s) => ({ ...s, priority: e.target.value }))}>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT</option>
                  </select>
                </label>
                <label>Referring Doctor<input value={order.referring_doctor} onChange={(e) => setOrder((s) => ({ ...s, referring_doctor: e.target.value }))} /></label>
                <div>
                  <p className="mini-title">Select Tests</p>
                  {loadingTests ? <span className="inline-loader" /> : null}
                  <div className="tests-picker">
                    {tests.map((test) => {
                      const active = order.test_ids.includes(test.id);
                      return (
                        <button key={test.id} type="button" className={active ? "test-chip test-chip-active" : "test-chip"} onClick={() => toggleTest(test.id)}>
                          <span>{test.test_name}</span>
                          <small>Rs {Number(test.price).toFixed(0)}</small>
                        </button>
                      );
                    })}
                  </div>
                  {orderErrors.test_ids ? <p className="field-error">{orderErrors.test_ids}</p> : null}
                </div>
                <div className="orders-summary"><span>{order.test_ids.length} tests</span><strong>Total Rs {total.toFixed(0)}</strong></div>
                <div className="modal-actions">
                  <button className="button button-secondary" type="button" onClick={() => setStep(1)}>Back</button>
                  <button className="button" type="button" onClick={submitNewCase}>Create Case</button>
                </div>
              </div>
            )}
            {newCaseMessage ? <p className="patients-message">{newCaseMessage}</p> : null}
          </div>
        </div>
      ) : null}

      {isBlocking ? (
        <div className="page-blocker">
          <div className="loader-card"><span className="inline-loader" /> <p>Saving, please wait...</p></div>
        </div>
      ) : null}
    </div>
  );
}

export function DashboardShell(props: { children: React.ReactNode; userEmail: string; userRole: string }) {
  return (
    <DashboardUiProvider>
      <DashboardShellInner {...props} />
    </DashboardUiProvider>
  );
}

