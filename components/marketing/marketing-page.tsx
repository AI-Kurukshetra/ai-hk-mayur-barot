import Link from "next/link";

type Props = {
  title: string;
  subtitle: string;
  points: string[];
};

export function MarketingPage({ title, subtitle, points }: Props) {
  return (
    <main className="landing-shell">
      <section className="landing-glass">
        <header className="landing-topbar">
          <Link href="/" className="landing-logo">
            <img src="/laboratory-microscope-icon.svg" alt="PathologyLab Pro" />
            <span>PathologyLab Pro</span>
          </Link>

          <nav className="landing-nav-pill">
            <Link href="/">Home</Link>
            <Link href="/about">About us</Link>
            <Link href="/for-pathologies">For Pathologies</Link>
            <Link href="/for-facilities">For Facilities</Link>
            <Link href="/features">Features</Link>
            <Link href="/blog">Blog</Link>
          </nav>

          <div className="landing-auth-pill">
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="landing-register">Register</Link>
          </div>
        </header>

        <section className="marketing-content-wrap">
          <div className="marketing-content-card">
            <h1>{title}</h1>
            <p>{subtitle}</p>
            <ul>
              {points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>

            <div className="landing-cta-row">
              <Link href="/signup" className="landing-cta-primary">Get started</Link>
              <Link href="/learn-more" className="landing-cta-secondary">Learn more</Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
