import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="landing-wrap">
      <section className="landing-hero">
        <div className="landing-badge-row">
          <span className="landing-chip">AI Kurukshetra Project</span>
          <span className="landing-chip">Next.js + Supabase + Vercel</span>
        </div>
        <h1>Modern Pathology Information System</h1>
        <p>
          Manage patient intake, orders, samples, results, reports, billing, and role-based user access in one secure
          lab platform.
        </p>

        <div className="landing-actions">
          <Link href="/login" className="button">Login</Link>
          <Link href="/signup" className="button button-secondary">Sign Up</Link>
          {user ? <Link href="/overview" className="button button-ghost">Go to Dashboard</Link> : null}
        </div>
      </section>

      <section className="landing-grid">
        <article className="landing-card">
          <h3>Role-Based Access</h3>
          <p>Admin, Receptionist, Sample Collection, Technician, Pathologist, and Billing modules with guarded access.</p>
          <span className="status-badge status-released">Secure</span>
        </article>
        <article className="landing-card">
          <h3>Real-Time Workflow</h3>
          <p>Create cases, track collection, enter results, and release reports with live Supabase-backed records.</p>
          <span className="status-badge status-processing">Live Data</span>
        </article>
        <article className="landing-card">
          <h3>Finance Visibility</h3>
          <p>Capture payments, monitor receivables, and review business metrics using searchable and sortable grids.</p>
          <span className="status-badge status-pending_collection">Insights</span>
        </article>
      </section>
    </main>
  );
}
