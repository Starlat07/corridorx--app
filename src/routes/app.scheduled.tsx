import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  COUNTRIES,
  formatCurrency,
  listScheduled,
  newId,
  removeScheduled,
  saveScheduled,
  type Country,
  type Scheduled,
} from "@/lib/corridorx";

export const Route = createFileRoute("/app/scheduled")({
  component: SchedulePage,
});

function SchedulePage() {
  const [items, setItems] = useState<Scheduled[]>([]);
  const [from, setFrom] = useState<Country>(COUNTRIES[0]);
  const [to, setTo] = useState<Country>(COUNTRIES[1]);
  const [amount, setAmount] = useState(300);
  const [cadence, setCadence] = useState<Scheduled["cadence"]>("monthly");
  const [name, setName] = useState("Family");

  useEffect(() => {
    const load = () => setItems(listScheduled());
    load();
    window.addEventListener("corridorx:update", load);
    return () => window.removeEventListener("corridorx:update", load);
  }, []);

  function create() {
    const nextRun = Date.now() + (cadence === "weekly" ? 7 : 30) * 24 * 3600 * 1000;
    saveScheduled({
      id: newId(),
      createdAt: Date.now(),
      from,
      to,
      amount,
      recipient: "bank",
      recipientName: name,
      cadence,
      nextRun: cadence === "on-rate" ? Date.now() : nextRun,
      active: true,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Scheduled transfers</h1>
        <p className="text-sm text-muted-foreground">
          Autonomous remittances powered by Rialo Reactive Transactions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="card-glass p-6">
          <h2 className="mb-4 text-lg font-semibold">Create automation</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="From" value={from.code} onChange={(v) => setFrom(COUNTRIES.find((c) => c.code === v)!)}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </Select>
            <Select label="To" value={to.code} onChange={(v) => setTo(COUNTRIES.find((c) => c.code === v)!)}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </Select>
            <Field label="Amount (USD)">
              <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="input" />
            </Field>
            <Select label="Cadence" value={cadence} onChange={(v) => setCadence(v as Scheduled["cadence"])}>
              <option value="weekly">Every week</option>
              <option value="monthly">Every month</option>
              <option value="on-rate">On favorable FX rate</option>
            </Select>
            <Field label="Recipient label">
              <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
            </Field>
          </div>
          <button className="btn-primary mt-5" onClick={create}>Create automation</button>
        </div>

        <div className="card-glass overflow-hidden">
          <div className="border-b border-border/60 p-4 text-sm font-semibold">Active automations</div>
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              None yet — create one to see it here.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <div>
                    <div className="font-medium">
                      {s.from.flag} → {s.to.flag} · {formatCurrency(s.amount, "USD")} to {s.recipientName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.cadence === "on-rate"
                        ? "Executes on favorable FX (Rialo Stream trigger)"
                        : `Next run ${new Date(s.nextRun).toLocaleDateString()}`}
                    </div>
                  </div>
                  <button
                    onClick={() => removeScheduled(s.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.65rem 0.85rem;
          border-radius: 0.6rem;
          background: var(--color-input);
          border: 1px solid var(--color-border);
          color: var(--color-foreground);
          font-size: 0.9rem;
        }
        .input:focus { border-color: var(--color-primary); outline: none; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <Field label={label}>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
    </Field>
  );
}
