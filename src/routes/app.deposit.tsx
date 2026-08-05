import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, CreditCard, ShieldCheck, WalletCards } from "lucide-react";
import {
  formatCurrency,
  getWalletBalance,
  listWalletDeposits,
  newId,
  saveWalletDeposit,
  type DepositMethod,
  type WalletDeposit,
} from "@/lib/corridorx";

export const Route = createFileRoute("/app/deposit")({
  component: Deposit,
});

const presets = [25, 50, 100, 250];

function Deposit() {
  const [amount, setAmount] = useState("100");
  const [method, setMethod] = useState<DepositMethod>("card");
  const [balance, setBalance] = useState(0);
  const [deposits, setDeposits] = useState<WalletDeposit[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setBalance(getWalletBalance());
    setDeposits(listWalletDeposits());
  }, []);

  const numericAmount = Number(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount >= 10 && numericAmount <= 10_000;
  const fee = validAmount && method === "card" ? numericAmount * 0.015 : 0;

  const total = useMemo(() => (validAmount ? numericAmount + fee : 0), [fee, numericAmount, validAmount]);

  function completeDeposit() {
    if (!validAmount) {
      setMessage("Enter an amount between $10 and $10,000.");
      return;
    }

    const deposit: WalletDeposit = {
      id: newId(),
      amount: numericAmount,
      feeUSD: fee,
      method,
      createdAt: Date.now(),
      status: "completed",
    };
    saveWalletDeposit(deposit);
    setBalance(getWalletBalance());
    setDeposits(listWalletDeposits());
    setMessage(`${formatCurrency(numericAmount, "USD")} was added to your CorridorX wallet.`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><WalletCards size={16} /> CorridorX wallet</div>
          <h1 className="text-3xl font-semibold">Add funds</h1>
          <p className="mt-1 text-sm text-muted-foreground">Keep a USD balance ready for your next cross-border transfer.</p>
        </div>
        <Link to="/app/send" className="btn-ghost">Send money</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <section className="card-glass space-y-6 p-6">
          <div>
            <label htmlFor="deposit-amount" className="text-sm font-medium">Amount to add</label>
            <div className="mt-2 flex items-center rounded-xl border border-border bg-background px-4 focus-within:ring-2 focus-within:ring-primary/30">
              <span className="text-xl text-muted-foreground">$</span>
              <input
                id="deposit-amount"
                value={amount}
                inputMode="decimal"
                onChange={(event) => { setAmount(event.target.value); setMessage(null); }}
                className="w-full bg-transparent px-2 py-4 text-2xl font-semibold outline-none"
              />
              <span className="text-sm text-muted-foreground">USD</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Minimum $10 · maximum $10,000 per deposit</p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {presets.map((preset) => (
              <button key={preset} type="button" className="btn-ghost py-2 text-sm" onClick={() => { setAmount(String(preset)); setMessage(null); }}>
                {formatCurrency(preset, "USD")}
              </button>
            ))}
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">How would you like to add funds?</legend>
            <MethodOption icon={<CreditCard size={19} />} title="Debit or credit card" detail="Available instantly · 1.5% processing fee" selected={method === "card"} onSelect={() => setMethod("card")} />
            <MethodOption icon={<Building2 size={19} />} title="Bank transfer" detail="Usually arrives in 1–2 business days · no fee" selected={method === "bank"} onSelect={() => setMethod("bank")} />
          </fieldset>

          {message && (
            <div className={`rounded-lg p-3 text-sm ${validAmount ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              {message}
            </div>
          )}
          <button type="button" className="btn-primary w-full" onClick={completeDeposit}>
            Add {validAmount ? formatCurrency(numericAmount, "USD") : "funds"}
          </button>
          <div className="flex gap-2 text-xs text-muted-foreground"><ShieldCheck size={16} className="mt-0.5 flex-none text-primary" /> This is a demo wallet flow. Connect a payment provider server-side before accepting real payments.</div>
        </section>

        <aside className="card-glass h-fit p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Available balance</div>
          <div className="mt-2 text-3xl font-semibold text-primary">{formatCurrency(balance, "USD")}</div>
          <div className="mt-6 space-y-3 border-t border-border pt-4 text-sm">
            <SummaryRow label="Deposit" value={validAmount ? formatCurrency(numericAmount, "USD") : "—"} />
            <SummaryRow label="Processing fee" value={validAmount ? formatCurrency(fee, "USD") : "—"} />
            <div className="flex justify-between border-t border-border pt-3 font-medium"><span>Total charged</span><span>{validAmount ? formatCurrency(total, "USD") : "—"}</span></div>
          </div>
        </aside>
      </div>

      {deposits.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Recent deposits</h2>
          <div className="card-glass divide-y divide-border">
            {deposits.slice(0, 10).map((deposit) => (
              <div key={deposit.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <div><div className="font-medium">{formatCurrency(deposit.amount, "USD")} added</div><div className="text-xs text-muted-foreground">{deposit.method === "card" ? "Card" : "Bank transfer"} · {new Date(deposit.createdAt).toLocaleString()}</div></div>
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"><CheckCircle2 size={13} /> Completed</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MethodOption({ icon, title, detail, selected, onSelect }: { icon: React.ReactNode; title: string; detail: string; selected: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}><span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span><span className="flex-1"><span className="block font-medium">{title}</span><span className="text-xs text-muted-foreground">{detail}</span></span><span className={`h-4 w-4 rounded-full border-4 ${selected ? "border-primary bg-background" : "border-muted"}`} /></button>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}
