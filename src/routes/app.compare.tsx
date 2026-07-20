import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles, Trophy, Zap, ShieldCheck, DollarSign } from "lucide-react";
import {
  COUNTRIES,
  aiRecommendation,
  formatCurrency,
  formatEta,
  getQuotes,
  rankQuotes,
  type Country,
  type Quote,
  type RecipientType,
} from "@/lib/corridorx";

export const Route = createFileRoute("/app/compare")({
  component: Compare,
  head: () => ({ meta: [{ title: "Compare routes — CorridorX" }] }),
});

function Compare() {
  const [from, setFrom] = useState<Country>(COUNTRIES[0]);
  const [to, setTo] = useState<Country>(COUNTRIES[1]);
  const [amount, setAmount] = useState(500);
  const [recipient, setRecipient] = useState<RecipientType>("bank");
  const [sort, setSort] = useState<"best" | "cheapest" | "fastest" | "reliable">("best");

  const quotes = useMemo(
    () => rankQuotes(getQuotes(from, to, amount || 0, recipient)),
    [from, to, amount, recipient],
  );

  const sorted = useMemo(() => {
    const arr = [...quotes];
    if (sort === "cheapest") return arr.sort((a, b) => a.totalCostUSD - b.totalCostUSD);
    if (sort === "fastest") return arr.sort((a, b) => a.etaMinutes - b.etaMinutes);
    if (sort === "reliable") return arr.sort((a, b) => b.reliability - a.reliability);
    return arr;
  }, [quotes, sort]);

  const recommended = quotes[0];
  const maxRecv = Math.max(...quotes.map((q) => q.recipientAmount), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Compare routes</h1>
        <p className="text-sm text-muted-foreground">
          Every provider ranked by cost, speed, and reliability — updated in real time.
        </p>
      </div>

      {/* Corridor form */}
      <div className="card-glass grid gap-4 p-5 md:grid-cols-4">
        <Select label="From" value={from.code} onChange={(v) => setFrom(COUNTRIES.find((c) => c.code === v)!)}>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
        </Select>
        <Select label="To" value={to.code} onChange={(v) => setTo(COUNTRIES.find((c) => c.code === v)!)}>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
        </Select>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Amount (USD)</span>
          <input type="number" min={1} className="input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </label>
        <Select label="Payout method" value={recipient} onChange={(v) => setRecipient(v as RecipientType)}>
          <option value="bank">Bank account</option>
          <option value="mobile">Mobile money</option>
          <option value="crypto">Crypto wallet</option>
        </Select>
      </div>

      {/* Recommended route highlight */}
      {recommended && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/50 bg-primary/5 p-6">
          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
            <Sparkles size={12} /> Recommended
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div
              className="grid h-14 w-14 flex-none place-items-center rounded-2xl text-2xl font-bold"
              style={{ background: `${recommended.provider.color}22`, color: recommended.provider.color }}
            >
              {recommended.provider.logo}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold">{recommended.provider.name}</div>
              <div className="text-xs text-muted-foreground">{recommended.provider.network}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase text-muted-foreground">Recipient gets</div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(recommended.recipientAmount, recommended.currency)}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <MiniStat icon={DollarSign} label="Fee" value={`$${recommended.feeUSD.toFixed(2)}`} />
            <MiniStat icon={Zap} label="Delivery" value={formatEta(recommended.etaMinutes)} />
            <MiniStat icon={ShieldCheck} label="Reliability" value={`${Math.round(recommended.reliability * 100)}%`} />
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-background/50 p-3 text-xs text-muted-foreground">
            <Sparkles size={14} className="mt-0.5 flex-none text-primary" />
            <span>{aiRecommendation(quotes)}</span>
          </p>
        </div>
      )}

      {/* Sort filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        {([
          { k: "best", l: "Best overall", i: Trophy },
          { k: "cheapest", l: "Cheapest", i: DollarSign },
          { k: "fastest", l: "Fastest", i: Zap },
          { k: "reliable", l: "Most reliable", i: ShieldCheck },
        ] as const).map(({ k, l, i: Icon }) => (
          <button
            key={k}
            onClick={() => setSort(k)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
              sort === k
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={12} /> {l}
          </button>
        ))}
      </div>

      {/* Ranked list */}
      <div className="space-y-2">
        {sorted.map((q, i) => {
          const isRec = q.provider.id === recommended?.provider.id;
          const recvPct = (q.recipientAmount / maxRecv) * 100;
          return (
            <div
              key={q.provider.id}
              className={`card-glass overflow-hidden ${isRec ? "outline outline-2 outline-primary" : ""}`}
            >
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 p-4">
                <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-surface text-xs font-bold text-muted-foreground">
                  #{i + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className="grid h-8 w-8 flex-none place-items-center rounded-lg text-sm font-bold"
                      style={{ background: `${q.provider.color}22`, color: q.provider.color }}
                    >
                      {q.provider.logo}
                    </div>
                    <span className="truncate font-semibold">{q.provider.name}</span>
                    {q.tags.map((t) => (
                      <span
                        key={t}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          t === "Best Overall"
                            ? "bg-primary text-primary-foreground"
                            : "border border-primary/40 text-primary"
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{q.provider.network}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Recipient gets</div>
                  <div className={`font-mono font-semibold ${isRec ? "text-lg text-primary" : "text-sm"}`}>
                    {formatCurrency(q.recipientAmount, q.currency)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-border/50 bg-surface/50 px-4 py-3 text-xs sm:grid-cols-4">
                <Cell k="Fee" v={`$${q.feeUSD.toFixed(2)}`} />
                <Cell k="FX rate" v={q.fxRate.toFixed(4)} />
                <Cell k="ETA" v={formatEta(q.etaMinutes)} />
                <Cell k="Reliability" v={`${Math.round(q.reliability * 100)}%`} />
              </div>
              <div className="h-1 w-full bg-surface">
                <div className="h-full bg-primary/70 transition-all" style={{ width: `${recvPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .input { width:100%; padding:.6rem .85rem; border-radius:.6rem; background:var(--color-input); border:1px solid var(--color-border); color:var(--color-foreground); font-size:.9rem; }
        .input:focus { border-color: var(--color-primary); outline:none; }
      `}</style>
    </div>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
    </label>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-background/50 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon size={11} /> {label}
      </div>
      <div className="mt-1 font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="mt-0.5 font-mono text-foreground">{v}</div>
    </div>
  );
}

// avoid unused Quote import warning
export type _Q = Quote;
