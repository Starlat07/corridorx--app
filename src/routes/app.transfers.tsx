import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Circle, Loader2, X } from "lucide-react";
import { formatCurrency, formatEta, listTransfers, type Transfer, type TransferStatus } from "@/lib/corridorx";

export const Route = createFileRoute("/app/transfers")({
  component: Transfers,
});

const STATUS_STYLES: Record<string, string> = {
  initiated: "bg-muted text-muted-foreground",
  processing: "bg-warning/15 text-warning",
  awaiting: "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
};

const STAGES: { key: TransferStatus; label: string; desc: string }[] = [
  { key: "initiated", label: "Initiated", desc: "Transfer created via CorridorX router" },
  { key: "processing", label: "Processing", desc: "Rialo Workflow orchestrating provider" },
  { key: "awaiting", label: "Awaiting confirmation", desc: "Provider settling on the network" },
  { key: "completed", label: "Completed", desc: "Funds delivered to recipient" },
];

function stageIndex(status: TransferStatus): number {
  if (status === "failed") return -1;
  const i = STAGES.findIndex((s) => s.key === status);
  return i >= 0 ? i : 0;
}

function Transfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | TransferStatus>("all");

  useEffect(() => {
    const load = () => setTransfers(listTransfers());
    load();
    window.addEventListener("corridorx:update", load);
    const i = setInterval(load, 1000);
    return () => {
      window.removeEventListener("corridorx:update", load);
      clearInterval(i);
    };
  }, []);

  const filtered = statusFilter === "all" ? transfers : transfers.filter((t) => t.status === statusFilter);
  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0];

  if (transfers.length === 0) {
    return (
      <div className="card-glass flex flex-col items-center gap-3 p-16 text-center">
        <h1 className="text-2xl font-semibold">No transfers yet</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Route your first cross-border payment to see it appear here in real time.
        </p>
        <Link to="/app/send" className="btn-primary mt-2">Send money</Link>
      </div>
    );
  }

  const counts: Record<string, number> = { all: transfers.length };
  for (const t of transfers) counts[t.status] = (counts[t.status] ?? 0) + 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Transfers</h1>
        <p className="text-sm text-muted-foreground">Live tracking across every corridor.</p>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {(["all", "initiated", "processing", "completed", "failed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
              statusFilter === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s} <span className="ml-1 opacity-60">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* List */}
        <div className="card-glass divide-y divide-border/60 overflow-hidden">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`flex w-full items-center justify-between gap-3 p-4 text-left text-sm transition hover:bg-surface-elevated ${
                selected?.id === t.id ? "bg-surface-elevated" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {t.from.flag} → {t.to.flag} · {formatCurrency(t.amount, "USD")}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {t.recipientName} · {new Date(t.createdAt).toLocaleString()}
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] capitalize ${STATUS_STYLES[t.status]}`}>
                {t.status}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No {statusFilter} transfers.</div>
          )}
        </div>

        {/* Detail */}
        {selected && (
          <div className="card-glass space-y-6 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Transfer</div>
                <div className="font-mono text-xs text-muted-foreground">{selected.id}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[selected.status]}`}>
                {selected.status}
              </span>
            </div>

            {/* Corridor summary */}
            <div className="grid grid-cols-3 items-center gap-2 rounded-xl border border-border/60 bg-surface p-4">
              <div className="text-center">
                <div className="text-xl">{selected.from.flag}</div>
                <div className="text-xs text-muted-foreground">{selected.from.currency}</div>
                <div className="mt-1 font-mono text-sm">{formatCurrency(selected.amount, "USD")}</div>
              </div>
              <div className="text-center text-primary">
                <div className="mx-auto h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
                <div className="mt-1 text-[10px] uppercase">via {selected.quote.provider.name}</div>
                <div className="text-[10px] text-muted-foreground">{formatEta(selected.quote.etaMinutes)}</div>
              </div>
              <div className="text-center">
                <div className="text-xl">{selected.to.flag}</div>
                <div className="text-xs text-muted-foreground">{selected.to.currency}</div>
                <div className="mt-1 font-mono text-sm text-gradient">
                  {formatCurrency(selected.quote.recipientAmount, selected.to.currency)}
                </div>
              </div>
            </div>

            {/* Progress stepper */}
            <ProgressStepper status={selected.status} />

            {/* Details */}
            <div className="grid gap-2 text-sm">
              <Row k="Recipient" v={`${selected.recipientName} · ${selected.recipientDetails}`} />
              <Row k="Provider" v={`${selected.quote.provider.name} (${selected.quote.provider.network})`} />
              <Row k="Fee" v={formatCurrency(selected.quote.feeUSD, "USD")} />
              <Row k="FX rate" v={`1 USD = ${selected.quote.fxRate.toFixed(4)} ${selected.to.currency}`} />
            </div>

            {/* Live timeline */}
            <div>
              <div className="mb-3 text-sm font-semibold">Live timeline</div>
              <ol className="space-y-3 border-l border-border pl-4">
                {selected.timeline.map((ev, i) => (
                  <li key={i} className="relative text-sm">
                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                    <div className="font-medium capitalize">{ev.status}</div>
                    <div className="text-xs text-muted-foreground">
                      {ev.note} · {new Date(ev.at).toLocaleTimeString()}
                    </div>
                  </li>
                ))}
                {["processing", "awaiting", "initiated"].includes(selected.status) && (
                  <li className="relative text-sm text-muted-foreground">
                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-muted ring-4 ring-background pulse-dot" />
                    <div className="flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin" />
                      Awaiting next update from Rialo Async…
                    </div>
                  </li>
                )}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressStepper({ status }: { status: TransferStatus }) {
  const failed = status === "failed";
  const currentIdx = failed ? STAGES.length - 1 : stageIndex(status);

  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progress</div>
      <div className="flex items-start gap-1">
        {STAGES.map((stage, i) => {
          const done = !failed && i < currentIdx;
          const active = !failed && i === currentIdx && status !== "completed";
          const isCompletedStage = !failed && status === "completed" && i === STAGES.length - 1;
          const passed = done || isCompletedStage;
          const isFailPoint = failed && i === currentIdx;

          return (
            <div key={stage.key} className="flex-1">
              <div className="flex items-center">
                <div
                  className={`grid h-8 w-8 flex-none place-items-center rounded-full border-2 text-xs transition ${
                    isFailPoint
                      ? "border-destructive bg-destructive text-destructive-foreground"
                      : passed
                      ? "border-primary bg-primary text-primary-foreground"
                      : active
                      ? "border-primary bg-primary/10 text-primary pulse-dot"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {isFailPoint ? <X size={14} /> : passed ? <Check size={14} /> : active ? <Loader2 size={14} className="animate-spin" /> : <Circle size={10} />}
                </div>
                {i < STAGES.length - 1 && (
                  <div className={`h-0.5 flex-1 ${passed ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
              <div className="mt-2 pr-2 text-[11px]">
                <div className={`font-medium ${passed || active ? "text-foreground" : "text-muted-foreground"}`}>
                  {isFailPoint ? "Failed" : stage.label}
                </div>
                <div className="text-muted-foreground">{stage.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-mono text-xs">{v}</span>
    </div>
  );
}
