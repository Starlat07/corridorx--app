import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  COUNTRIES,
  getQuotes,
  listTransfers,
  listScheduled,
  getWalletBalance,
  listEscrowProjects,
  formatCurrency,
  newId,
  rankQuotes,
  saveScheduled,
  saveTransfer,
  type Transfer,
  type Scheduled,
} from "@/lib/corridorx";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function seedDemo() {
  const [us, ng, gb, in_, ke] = [
    COUNTRIES.find((c) => c.code === "US")!,
    COUNTRIES.find((c) => c.code === "NG")!,
    COUNTRIES.find((c) => c.code === "GB")!,
    COUNTRIES.find((c) => c.code === "IN")!,
    COUNTRIES.find((c) => c.code === "KE")!,
  ];
  const samples = [
    { from: us, to: ng, amount: 500, name: "Ada Okafor", detail: "GTBank · 0123456789", days: 2, status: "completed" as const },
    { from: gb, to: in_, amount: 1200, name: "Rohan Patel", detail: "HDFC · 5544332211", days: 5, status: "completed" as const },
    { from: us, to: ke, amount: 250, name: "Wanjiku M.", detail: "M-Pesa · +254712345678", days: 0, status: "processing" as const },
    { from: us, to: ng, amount: 750, name: "Chidi O.", detail: "Zenith · 7788990011", days: 8, status: "failed" as const },
  ];
  for (const s of samples) {
    const quotes = rankQuotes(getQuotes(s.from, s.to, s.amount, "bank"));
    const q = quotes[0];
    const createdAt = Date.now() - s.days * 24 * 3600 * 1000;
    saveTransfer({
      id: newId(),
      createdAt,
      from: s.from,
      to: s.to,
      amount: s.amount,
      recipient: "bank",
      recipientName: s.name,
      recipientDetails: s.detail,
      quote: q,
      status: s.status,
      timeline: [
        { at: createdAt, status: "initiated", note: "Transfer created via CorridorX router" },
        { at: createdAt + 60_000, status: "processing", note: "Rialo Workflow routing payment" },
        ...(s.status === "completed"
          ? [{ at: createdAt + 180_000, status: "completed" as const, note: "Funds delivered" }]
          : s.status === "failed"
          ? [{ at: createdAt + 200_000, status: "failed" as const, note: "Provider declined — auto-retry queued" }]
          : []),
      ],
    });
  }
  saveScheduled({
    id: newId(),
    createdAt: Date.now(),
    from: us,
    to: ng,
    amount: 300,
    recipient: "bank",
    recipientName: "Family",
    cadence: "monthly",
    nextRun: Date.now() + 15 * 24 * 3600 * 1000,
    active: true,
  });
}

function Dashboard() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [scheduled, setScheduled] = useState<Scheduled[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [escrows, setEscrows] = useState(0);

  useEffect(() => {
    const load = () => {
      setTransfers(listTransfers());
      setScheduled(listScheduled());
      setWalletBalance(getWalletBalance());
      setEscrows(listEscrowProjects().length);
    };
    load();
    window.addEventListener("corridorx:update", load);
    return () => window.removeEventListener("corridorx:update", load);
  }, []);

  const completed = transfers.filter((t) => t.status === "completed");
  const failed = transfers.filter((t) => t.status === "failed");
  const activeScheduled = scheduled.filter((s) => s.active).length;
  const saved = transfers.reduce((s, t) => s + Math.max(0, 0.03 * t.amount - t.quote.totalCostUSD), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your routing performance at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {transfers.length === 0 && (
            <button className="btn-ghost" onClick={seedDemo}>Load demo data</button>
          )}
          <Link to="/app/deposit" className="btn-ghost">Add funds</Link>
          <Link to="/app/escrow" className="btn-ghost">Use Safupay</Link>
          <Link to="/app/send" className="btn-primary">Start a transfer</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
        <Link to="/app/deposit" className="card-glass p-5 transition hover:border-primary/50">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Wallet balance</div>
          <div className="mt-2 text-2xl font-semibold text-primary">{formatCurrency(walletBalance, "USD")}</div>
        </Link>
        <Link to="/app/escrow" className="card-glass p-5 transition hover:border-primary/50">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Safupay projects</div>
          <div className="mt-2 text-2xl font-semibold">{escrows}</div>
        </Link>
        <Stat label="Total transfers" value={String(transfers.length)} />
        <Stat label="Money saved" value={formatCurrency(saved, "USD")} accent />
        <Stat label="Active scheduled" value={String(activeScheduled)} />
        <Stat label="Completed" value={String(completed.length)} />
        <Stat label="Failed" value={String(failed.length)} tone="destructive" />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent transfers</h2>
          <Link to="/app/transfers" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        {transfers.length === 0 ? (
          <Empty
            title="No transfers yet"
            body="Route your first payment to see it here."
            cta={<Link to="/app/send" className="btn-primary">Send money</Link>}
          />
        ) : (
          <div className="card-glass divide-y divide-border">
            {transfers.slice(0, 5).map((t) => (
              <Link key={t.id} to="/app/transfers" className="flex items-center justify-between gap-4 p-4 text-sm hover:bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="text-lg">{t.from.flag} → {t.to.flag}</div>
                  <div>
                    <div className="font-medium">{formatCurrency(t.amount, "USD")} to {t.recipientName}</div>
                    <div className="text-xs text-muted-foreground">via {t.quote.provider.name} · {new Date(t.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{formatCurrency(t.quote.recipientAmount, t.to.currency)}</div>
                  <StatusPill status={t.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Scheduled transfers</h2>
          <Link to="/app/scheduled" className="text-xs text-primary hover:underline">Manage →</Link>
        </div>
        {scheduled.length === 0 ? (
          <Empty
            title="No automations yet"
            body="Set up recurring or FX-triggered transfers."
            cta={<Link to="/app/scheduled" className="btn-ghost">Create schedule</Link>}
          />
        ) : (
          <div className="card-glass divide-y divide-border">
            {scheduled.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <div className="font-medium">{s.from.flag} → {s.to.flag} · {formatCurrency(s.amount, "USD")}</div>
                  <div className="text-xs text-muted-foreground">{s.cadence} · next {new Date(s.nextRun).toLocaleDateString()}</div>
                </div>
                <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {s.active ? "Active" : "Paused"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent, tone }: { label: string; value: string; accent?: boolean; tone?: "destructive" }) {
  return (
    <div className="card-glass p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${accent ? "text-primary" : tone === "destructive" ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}

function Empty({ title, body, cta }: { title: string; body: string; cta: React.ReactNode }) {
  return (
    <div className="card-glass flex flex-col items-center gap-3 p-10 text-center">
      <div className="text-base font-semibold">{title}</div>
      <div className="max-w-md text-sm text-muted-foreground">{body}</div>
      {cta}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    initiated: "text-muted-foreground",
    processing: "text-warning",
    awaiting: "text-warning",
    completed: "text-primary",
    failed: "text-destructive",
  };
  return <div className={`text-xs capitalize ${map[status] ?? ""}`}>{status}</div>;
}
