import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, listTransfers, type Transfer } from "@/lib/corridorx";

export const Route = createFileRoute("/app/analytics")({
  component: Analytics,
  head: () => ({ meta: [{ title: "Analytics — CorridorX" }] }),
});

type Range = "7d" | "30d" | "90d" | "all";

const PALETTE = ["#14E0B4", "#7AA5FF", "#F5A623", "#C084FC", "#9FE870", "#FF7A9A"];

function Analytics() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [range, setRange] = useState<Range>("30d");

  useEffect(() => {
    const load = () => setTransfers(listTransfers());
    load();
    window.addEventListener("corridorx:update", load);
    return () => window.removeEventListener("corridorx:update", load);
  }, []);

  const cutoff = useMemo(() => {
    const now = Date.now();
    if (range === "7d") return now - 7 * 86400000;
    if (range === "30d") return now - 30 * 86400000;
    if (range === "90d") return now - 90 * 86400000;
    return 0;
  }, [range]);

  const filtered = useMemo(
    () => transfers.filter((t) => t.createdAt >= cutoff),
    [transfers, cutoff],
  );

  // Trend series by day
  const trend = useMemo(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 30;
    const buckets: Record<string, { date: string; volume: number; count: number; saved: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), volume: 0, count: 0, saved: 0 };
    }
    for (const t of filtered) {
      const key = new Date(t.createdAt).toISOString().slice(0, 10);
      if (!buckets[key]) continue;
      buckets[key].volume += t.amount;
      buckets[key].count += 1;
      buckets[key].saved += Math.max(0, 0.03 * t.amount - t.quote.totalCostUSD);
    }
    return Object.values(buckets);
  }, [filtered, range]);

  const totals = useMemo(() => {
    let volume = 0, saved = 0, completed = 0, failed = 0;
    for (const t of filtered) {
      volume += t.amount;
      saved += Math.max(0, 0.03 * t.amount - t.quote.totalCostUSD);
      if (t.status === "completed") completed++;
      if (t.status === "failed") failed++;
    }
    return { volume, saved, completed, failed, count: filtered.length };
  }, [filtered]);

  const corridors = useMemo(() => {
    const map = new Map<string, { name: string; volume: number; count: number }>();
    for (const t of filtered) {
      const k = `${t.from.code} → ${t.to.code}`;
      const cur = map.get(k) ?? { name: `${t.from.flag} → ${t.to.flag}`, volume: 0, count: 0 };
      cur.volume += t.amount; cur.count++;
      map.set(k, cur);
    }
    return [...map.values()].sort((a, b) => b.volume - a.volume).slice(0, 6);
  }, [filtered]);

  const providers = useMemo(() => {
    const map = new Map<string, { name: string; count: number; success: number; totalEta: number; color: string }>();
    for (const t of filtered) {
      const cur = map.get(t.quote.provider.name) ?? {
        name: t.quote.provider.name, count: 0, success: 0, totalEta: 0, color: t.quote.provider.color,
      };
      cur.count++;
      if (t.status === "completed") cur.success++;
      cur.totalEta += t.quote.etaMinutes;
      map.set(t.quote.provider.name, cur);
    }
    return [...map.values()].map((p) => ({
      ...p,
      successRate: p.count ? Math.round((p.success / p.count) * 100) : 0,
      avgEta: p.count ? Math.round(p.totalEta / p.count) : 0,
    })).sort((a, b) => b.count - a.count);
  }, [filtered]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Trends across your CorridorX activity.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(["7d", "30d", "90d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-xs transition ${
                range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "all" ? "All time" : r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Transfers" value={String(totals.count)} />
        <Stat label="Volume" value={formatCurrency(totals.volume, "USD")} />
        <Stat label="Money saved" value={formatCurrency(totals.saved, "USD")} accent />
        <Stat label="Success rate" value={totals.count ? `${Math.round((totals.completed / totals.count) * 100)}%` : "—"} />
      </div>

      {filtered.length === 0 ? (
        <Empty />
      ) : (
        <>
          {/* Trend chart */}
          <section className="card-glass p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Transfer volume trend</h2>
              <span className="text-xs text-muted-foreground">USD sent per day</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, "USD")} />
                  <Area type="monotone" dataKey="volume" stroke="hsl(var(--primary))" fill="url(#vol)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Money saved */}
            <section className="card-glass p-5">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold">Money saved vs. legacy providers</h2>
                <span className="text-xs text-muted-foreground">Est. USD saved</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, "USD")} />
                    <Bar dataKey="saved" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Top corridors */}
            <section className="card-glass p-5">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold">Most-used corridors</h2>
                <span className="text-xs text-muted-foreground">Top {corridors.length}</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={corridors} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={70} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, "USD")} />
                    <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                      {corridors.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* Provider performance */}
          <section className="card-glass p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Provider performance</h2>
              <span className="text-xs text-muted-foreground">Success rate & routing share</span>
            </div>
            <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={providers}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {providers.map((p, i) => (
                        <Cell key={p.name} fill={p.color || PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {providers.map((p) => (
                  <div key={p.name} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                        <span className="font-medium">{p.name}</span>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {p.count} routed · avg {p.avgEta} min
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                        <div className="h-full bg-primary" style={{ width: `${p.successRate}%` }} />
                      </div>
                      <span className="w-10 text-right font-mono text-xs">{p.successRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  fontSize: "12px",
};

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card-glass p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

function Empty() {
  return (
    <div className="card-glass p-12 text-center text-sm text-muted-foreground">
      No transfers in this range — try a wider window or route a new payment.
    </div>
  );
}
