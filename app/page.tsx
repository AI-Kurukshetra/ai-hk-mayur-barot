import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="landing-shell">
      <section className="landing-glass">
        <header className="landing-topbar">
          <Link href="/" className="landing-logo">
            <img src="/laboratory-microscope-icon.svg" alt="PathologyLab Pro" />
            <span>PathologyLab Pro</span>
          </Link>

          <nav className="landing-nav-pill">
            <a href="#home">Home</a>
            <a href="#about">About us</a>
            <a href="#labs">For Pathologies</a>
            <a href="#facilities">For Facilities</a>
            <a href="#features">Features</a>
          </nav>

          <div className="landing-auth-pill">
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="landing-register">Register</Link>
          </div>
        </header>

        <section className="landing-hero-modern" id="home">
          <div className="landing-hero-orb">
            <img src="/laboratory-microscope-icon.svg" alt="Lab icon" />
          </div>
          <h1>Maximize Your Lab&apos;s Revenue</h1>
          <p>With access to additional case volume and robust lab operations in a single modern platform.</p>

          <div className="landing-cta-row">
            {user ? <Link href="/overview" className="landing-cta-primary">Go Dashboard</Link> : <Link href="/signup" className="landing-cta-primary">Get started</Link>}
            <Link href="/login" className="landing-cta-secondary">Learn more</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
