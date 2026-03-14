export default function DashboardLoading() {
  return (
    <section className="grid page-gap">
      <div className="stats-grid">
        <article className="stat-card skeleton-block" />
        <article className="stat-card skeleton-block" />
        <article className="stat-card skeleton-block" />
        <article className="stat-card skeleton-block" />
      </div>
      <div className="content-grid two-col">
        <section className="card panel skeleton-block" style={{ minHeight: 280 }} />
        <section className="card panel skeleton-block" style={{ minHeight: 280 }} />
      </div>
    </section>
  );
}
