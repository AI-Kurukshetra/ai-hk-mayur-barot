import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <section className="card panel" style={{ maxWidth: 720 }}>
      <h2>Access denied</h2>
      <p>You are signed in, but your role does not have permission to access this page.</p>
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <Link href="/overview" className="button button-secondary">
          Go to Dashboard
        </Link>
      </div>
    </section>
  );
}
