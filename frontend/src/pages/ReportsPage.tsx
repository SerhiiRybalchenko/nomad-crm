import { useMemo, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDeals, useReports } from "../hooks/queries";
import { STAGE_META, STAGE_ORDER } from "../lib/stages";
import { formatCurrency } from "../lib/format";
import { CountUp } from "../components/CountUp";
import { Skeleton } from "../components/Skeleton";
import { IconChart, IconLayers, IconTarget, IconTrendUp } from "../components/icons";
import "../styles/reports.css";

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", { month: "short" });

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return MONTH_LABEL.format(new Date(Date.UTC(y, m - 1, 1)));
}

function StageTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="viz-tooltip">
      <div className="tt-label">{STAGE_META[p.stage as keyof typeof STAGE_META].label}</div>
      <div className="tt-value">{p.count} deals</div>
      <div className="text-muted" style={{ marginTop: 2 }}>
        {formatCurrency(p.amount, true)}
      </div>
    </div>
  );
}

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="viz-tooltip">
      <div className="tt-label">{label ? monthLabel(label) : ""}</div>
      <div className="tt-value">{formatCurrency(p.revenue)}</div>
      <div className="text-muted" style={{ marginTop: 2 }}>
        {p.deals} deal{p.deals === 1 ? "" : "s"} closed
      </div>
    </div>
  );
}

export function ReportsPage() {
  const reportsQuery = useReports();
  const dealsQuery = useDeals();
  const report = reportsQuery.data;
  const loading = reportsQuery.isLoading;

  const funnelStages = useMemo(() => STAGE_ORDER.filter((s) => s !== "lost"), []);

  const byStageMap = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    report?.byStage.forEach((r) => map.set(r.stage, r));
    return map;
  }, [report]);

  const maxFunnelCount = Math.max(1, ...funnelStages.map((s) => byStageMap.get(s)?.count ?? 0));

  const avgDealSize = useMemo(() => {
    const deals = dealsQuery.data ?? [];
    const won = deals.filter((d) => d.stage === "won");
    if (won.length === 0) return 0;
    return won.reduce((sum, d) => sum + Number(d.amount), 0) / won.length;
  }, [dealsQuery.data]);

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Reports</span>
          <h1>Pipeline health</h1>
          <p className="subtitle">The three spreadsheets, replaced by one live view.</p>
        </div>
      </div>

      {loading || !report ? (
        <ReportsSkeleton />
      ) : (
        <>
          <div className="stat-grid">
            <StatTile
              icon={<IconLayers width={16} height={16} />}
              color="var(--accent)"
              label="Open pipeline value"
              value={report.totals.pipelineValue}
              format={(n) => formatCurrency(n, true)}
            />
            <StatTile
              icon={<IconTrendUp width={16} height={16} />}
              color="var(--stage-won)"
              label="Revenue won"
              value={report.totals.wonValue}
              format={(n) => formatCurrency(n, true)}
            />
            <StatTile
              icon={<IconTarget width={16} height={16} />}
              color="var(--stage-proposal)"
              label="Conversion rate"
              value={report.totals.conversionRate}
              format={(n) => `${n.toFixed(1)}%`}
              sub={`${report.totals.won} won · ${report.totals.lost} lost`}
            />
            <StatTile
              icon={<IconChart width={16} height={16} />}
              color="var(--stage-lead)"
              label="Avg. won deal size"
              value={avgDealSize}
              format={(n) => formatCurrency(n, true)}
            />
          </div>

          <div className="chart-grid">
            <div className="panel chart-panel">
              <div className="chart-panel-head">
                <div>
                  <h3>Revenue over time</h3>
                  <div className="chart-sub">Won deals by close month, last 6 months</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={report.revenueOverTime} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={monthLabel}
                    stroke="var(--chart-axis)"
                    tick={{ fill: "var(--chart-axis)", fontSize: 11.5 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--chart-grid)" }}
                  />
                  <YAxis
                    tickFormatter={(v) => formatCurrency(v, true)}
                    stroke="var(--chart-axis)"
                    tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={54}
                  />
                  <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "var(--panel-border-strong)" }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fill="url(#revenueFill)"
                    animationDuration={900}
                    activeDot={{ r: 5, fill: "var(--accent)", stroke: "var(--bg)", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="panel chart-panel">
              <div className="chart-panel-head">
                <div>
                  <h3>Deals by stage</h3>
                  <div className="chart-sub">Count across the board right now</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={report.byStage} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis
                    dataKey="stage"
                    tickFormatter={(s: string) => STAGE_META[s as keyof typeof STAGE_META].label}
                    stroke="var(--chart-axis)"
                    tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--chart-grid)" }}
                    interval={0}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="var(--chart-axis)"
                    tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip content={<StageTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={800} maxBarSize={46}>
                    {report.byStage.map((entry) => (
                      <Cell key={entry.stage} fill={STAGE_META[entry.stage].color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                {STAGE_ORDER.map((s) => (
                  <span key={s} className="chart-legend-item">
                    <span className="chart-legend-swatch" style={{ background: STAGE_META[s].color }} />
                    {STAGE_META[s].label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="panel funnel-panel">
            <div className="chart-panel-head">
              <div>
                <h3>Pipeline funnel</h3>
                <div className="chart-sub">Where deals are right now, lead through won</div>
              </div>
            </div>
            <div className="funnel-rows">
              {funnelStages.map((stage) => {
                const stat = byStageMap.get(stage) ?? { count: 0, amount: 0 };
                const pct = Math.max(4, Math.round((stat.count / maxFunnelCount) * 100));
                return (
                  <div className="funnel-row" key={stage}>
                    <span className="fr-label">{STAGE_META[stage].label}</span>
                    <span className="fr-track">
                      <div
                        className="fr-fill"
                        style={{
                          width: `${pct}%`,
                          background: STAGE_META[stage].color,
                          transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
                        }}
                      />
                    </span>
                    <span className="fr-value">{stat.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({
  icon,
  color,
  label,
  value,
  format,
  sub,
}: {
  icon: ReactNode;
  color: string;
  label: string;
  value: number;
  format: (n: number) => string;
  sub?: string;
}) {
  return (
    <div className="panel stat-tile">
      <div className="stat-tile-icon" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
        {icon}
      </div>
      <div className="value">
        <CountUp value={value} format={format} />
      </div>
      <div className="label">{label}</div>
      {sub && (
        <span className="delta" style={{ background: "var(--raised)", color: "var(--text-secondary)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div>
      <div className="stat-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={110} style={{ borderRadius: 20 }} />
        ))}
      </div>
      <div className="chart-grid">
        <Skeleton width="100%" height={280} style={{ borderRadius: 20 }} />
        <Skeleton width="100%" height={280} style={{ borderRadius: 20 }} />
      </div>
    </div>
  );
}
