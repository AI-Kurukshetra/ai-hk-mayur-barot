"use client";

import { useMemo } from "react";
import type { OverviewPaymentRow } from "@/lib/overview/service";

type Props = { rows: OverviewPaymentRow[] };

export function OverviewCharts({ rows }: Props) {
  const dailyBars = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = new Date(row.paid_at).toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + Number(row.amount ?? 0));
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([date, total]) => ({ date, total }));
  }, [rows]);

  const maxDaily = Math.max(...dailyBars.map((item) => item.total), 1);

  const modeData = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = row.mode || "other";
      map.set(key, (map.get(key) ?? 0) + Number(row.amount ?? 0));
    }
    const list = Array.from(map.entries()).map(([mode, total]) => ({ mode, total }));
    const totalAll = list.reduce((sum, item) => sum + item.total, 0);
    return list
      .sort((a, b) => b.total - a.total)
      .slice(0, 4)
      .map((item) => ({
        ...item,
        percentage: totalAll > 0 ? Math.round((item.total / totalAll) * 100) : 0,
      }));
  }, [rows]);

  return (
    <div className="overview-charts-wrap">
      <article className="chart-card">
        <h4>Last 7 Days Collection</h4>
        <div className="bar-chart">
          {dailyBars.length === 0 ? (
            <p className="chart-empty">No payment data</p>
          ) : (
            dailyBars.map((item) => (
              <div key={item.date} className="bar-col">
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${Math.max(8, Math.round((item.total / maxDaily) * 100))}%` }} />
                </div>
                <small>{new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</small>
              </div>
            ))
          )}
        </div>
      </article>

      <article className="chart-card">
        <h4>Payment Mode Mix</h4>
        <div className="mode-list">
          {modeData.length === 0 ? (
            <p className="chart-empty">No payment data</p>
          ) : (
            modeData.map((item) => (
              <div key={item.mode} className="mode-row">
                <div className="mode-label">
                  <span className="mode-dot" />
                  <strong>{item.mode.replaceAll("_", " ")}</strong>
                </div>
                <div className="mode-progress">
                  <div className="mode-progress-fill" style={{ width: `${Math.max(6, item.percentage)}%` }} />
                </div>
                <span>{item.percentage}%</span>
              </div>
            ))
          )}
        </div>
      </article>
    </div>
  );
}
