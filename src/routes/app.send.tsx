import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import {
  COUNTRIES,
  COUNTRY_BANKS,
  COUNTRY_MOBILE_MONEY,
  CRYPTO_NETWORKS,
  aiRecommendation,
  formatCurrency,
  formatEta,
  getQuotes,
  newId,
  rankQuotes,
  saveTransfer,
  simulateTransfer,
  validateBankAccount,
  validateCryptoAddress,
  validateMobilePhone,
  type Country,
  type Quote,
  type RecipientType,
} from "@/lib/corridorx";
import { listBanks, resolveBankAccount } from "@/lib/banks.functions";

export const Route = createFileRoute("/app/send")({
  component: Send,
});

type Step = "form" | "quotes" | "review" | "done";
type LiveBank = { code: string; name: string };

// Countries where Flutterwave provides a live bank list.
const LIVE_BANK_COUNTRIES = new Set(["NG", "GH", "KE", "ZA"]);
// Countries where we auto-resolve the account holder name.
const AUTO_RESOLVE_COUNTRIES = new Set(["NG"]);

function Send() {
  const navigate = useNavigate();
  const listBanksFn = useServerFn(listBanks);
  const resolveFn = useServerFn(resolveBankAccount);

  const [step, setStep] = useState<Step>("form");
  const [from, setFrom] = useState<Country>(COUNTRIES[0]);
  const [to, setTo] = useState<Country>(COUNTRIES[1]);
  const [amount, setAmount] = useState<number>(500);
  const [recipient, setRecipient] = useState<RecipientType>("bank");
  const [recipientName, setRecipientName] = useState("");

  // Bank fields — bankCode is the provider-issued code; bankLabel is what we show.
  const [bankCode, setBankCode] = useState<string>("");
  const [bankLabel, setBankLabel] = useState<string>("");
  const [bankAccount, setBankAccount] = useState<string>("");
  const [liveBanks, setLiveBanks] = useState<LiveBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState<string | null>(null);

  // Name resolution state (NG only for now).
  type ResolveState =
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ok"; name: string }
    | { kind: "error"; message: string };
  const [resolveState, setResolveState] = useState<ResolveState>({ kind: "idle" });

  const [momoProvider, setMomoProvider] = useState<string>("");
  const [momoPhone, setMomoPhone] = useState<string>("");
  const [cryptoNetwork, setCryptoNetwork] = useState<string>(CRYPTO_NETWORKS[0].id);
  const [cryptoAddress, setCryptoAddress] = useState<string>("");
  const [pref, setPref] = useState<"best" | "cheapest" | "fastest" | "reliable">("best");
  const [selected, setSelected] = useState<Quote | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const staticBanks = useMemo(() => COUNTRY_BANKS[to.code] ?? [], [to.code]);
  const availableMomo = useMemo(() => COUNTRY_MOBILE_MONEY[to.code] ?? [], [to.code]);
  const useLiveBanks = LIVE_BANK_COUNTRIES.has(to.code);
  const autoResolveEnabled = AUTO_RESOLVE_COUNTRIES.has(to.code);

  // Fetch live bank list whenever the recipient country changes.
  useEffect(() => {
    let cancelled = false;
    setBankCode("");
    setBankLabel("");
    setBankAccount("");
    setRecipientName("");
    setResolveState({ kind: "idle" });
    setLiveBanks([]);
    setBanksError(null);
    if (!useLiveBanks) return;
    setBanksLoading(true);
    listBanksFn({ data: { country: to.code } })
      .then((res) => {
        if (cancelled) return;
        if (res.supported && res.banks.length) {
          setLiveBanks(res.banks);
        } else {
          setBanksError(res.error ?? "Bank list unavailable — enter bank manually.");
        }
      })
      .catch(() => !cancelled && setBanksError("Could not reach bank provider."))
      .finally(() => !cancelled && setBanksLoading(false));
    return () => {
      cancelled = true;
    };
  }, [to.code, useLiveBanks, listBanksFn]);

  // Reset mobile money & recipient name when relevant fields change.
  useEffect(() => {
    setMomoProvider(availableMomo[0] ?? "");
  }, [to.code, availableMomo]);

  // Debounced auto-resolve of Nigerian account names.
  const resolveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (recipient !== "bank") return;
    if (resolveTimer.current) clearTimeout(resolveTimer.current);

    if (!autoResolveEnabled) return;
    const digits = bankAccount.replace(/\D/g, "");
    if (!bankCode || digits.length !== 10) {
      setResolveState({ kind: "idle" });
      if (!autoResolveEnabled) return;
      // Clear stale name when incomplete
      if (resolveState.kind === "ok") setRecipientName("");
      return;
    }
    setResolveState({ kind: "loading" });
    setRecipientName("");
    resolveTimer.current = setTimeout(() => {
      resolveFn({ data: { country: to.code, bankCode, accountNumber: digits } })
        .then((res) => {
          if (res.resolved) {
            setResolveState({ kind: "ok", name: res.name });
            setRecipientName(res.name);
          } else {
            setResolveState({ kind: "error", message: res.reason });
          }
        })
        .catch(() => setResolveState({ kind: "error", message: "Verification service unavailable." }));
    }, 600);
    return () => {
      if (resolveTimer.current) clearTimeout(resolveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankCode, bankAccount, to.code, recipient, autoResolveEnabled, resolveFn]);

  const recipientDetails = useMemo(() => {
    if (recipient === "bank") return bankLabel && bankAccount ? `${bankLabel} · ${bankAccount}` : "";
    if (recipient === "mobile") return momoProvider && momoPhone ? `${momoProvider} · ${momoPhone}` : "";
    const net = CRYPTO_NETWORKS.find((n) => n.id === cryptoNetwork);
    return cryptoAddress ? `${net?.label} · ${cryptoAddress}` : "";
  }, [recipient, bankLabel, bankAccount, momoProvider, momoPhone, cryptoNetwork, cryptoAddress]);

  const recipientInstructions = useMemo(() => {
    if (recipient === "bank") {
      if (autoResolveEnabled)
        return `Select the recipient's ${to.name} bank and enter their 10-digit account number. We'll auto-verify the account holder's name via NIBSS.`;
      if (useLiveBanks) return `Live bank list for ${to.name}. Enter the recipient's account number, then type their name manually.`;
      return `Enter the ${to.name} bank and local account number, then type the recipient's name manually.`;
    }
    if (recipient === "mobile") {
      if (!availableMomo.length) return `Mobile money is limited in ${to.name}. Consider bank or crypto payout instead.`;
      return `Choose the recipient's mobile wallet and enter their registered phone number in international format.`;
    }
    const net = CRYPTO_NETWORKS.find((n) => n.id === cryptoNetwork);
    return `Paste a valid ${net?.label} address. ${net?.hint}. Double-check — crypto transfers are irreversible.`;
  }, [recipient, to, availableMomo, cryptoNetwork, autoResolveEnabled, useLiveBanks]);

  const recipientErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (recipient === "bank") {
      if (!bankLabel) errs.bankName = "Select a bank";
      const e = validateBankAccount(bankAccount);
      if (e) errs.bankAccount = e;
      if (autoResolveEnabled && resolveState.kind === "error") errs.bankAccount = resolveState.message;
    } else if (recipient === "mobile") {
      if (!momoProvider) errs.momoProvider = "Select a mobile money provider";
      const e = validateMobilePhone(momoPhone);
      if (e) errs.momoPhone = e;
    } else {
      const e = validateCryptoAddress(cryptoNetwork, cryptoAddress);
      if (e) errs.cryptoAddress = e;
    }
    return errs;
  }, [recipient, bankLabel, bankAccount, momoProvider, momoPhone, cryptoNetwork, cryptoAddress, autoResolveEnabled, resolveState]);

  const nameLocked = autoResolveEnabled && recipient === "bank";
  const recipientValid =
    Object.keys(recipientErrors).length === 0 &&
    recipientDetails.length > 0 &&
    (!nameLocked || resolveState.kind === "ok");
  const canProceed = amount > 0 && recipientName.trim().length >= 2 && recipientValid;

  const subSteps = useMemo(
    () => [
      { key: "type", label: "Payout type", done: !!recipient },
      { key: "country", label: `Recipient in ${to.name}`, done: !!to },
      { key: "details", label: "Recipient details", done: recipientValid },
      { key: "amount", label: "Amount", done: amount > 0 },
    ],
    [recipient, to, recipientValid, amount],
  );

  const quotes = useMemo(() => {
    if (!canProceed) return [] as Quote[];
    return rankQuotes(getQuotes(from, to, amount, recipient));
  }, [from, to, amount, recipient, canProceed]);

  const filteredQuotes = useMemo(() => {
    if (pref === "cheapest") return [...quotes].sort((a, b) => a.totalCostUSD - b.totalCostUSD);
    if (pref === "fastest") return [...quotes].sort((a, b) => a.etaMinutes - b.etaMinutes);
    if (pref === "reliable") return [...quotes].sort((a, b) => b.reliability - a.reliability);
    return quotes;
  }, [quotes, pref]);

  function proceedToQuotes() {
    if (!canProceed) return;
    setSelected(quotes[0] ?? null);
    setStep("quotes");
  }

  function confirmTransfer() {
    if (!selected) return;
    const id = newId();
    setCreatedId(id);
    saveTransfer({
      id,
      createdAt: Date.now(),
      from,
      to,
      amount,
      recipient,
      recipientName,
      recipientDetails,
      quote: selected,
      status: "initiated",
      timeline: [{ at: Date.now(), status: "initiated", note: "Transfer created via CorridorX router" }],
    });
    simulateTransfer(id);
    setStep("done");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Send money</h1>
          <p className="text-sm text-muted-foreground">Describe the transfer. CorridorX finds the best route.</p>
        </div>
        <Stepper step={step} />
      </div>

      {step === "form" && (
        <div className="card-glass space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <CountrySelect label="Sender country" value={from} onChange={setFrom} />
            <CountrySelect label="Recipient country" value={to} onChange={setTo} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Amount (USD)">
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="input"
              />
            </Field>
            <Field label="Recipient type">
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value as RecipientType)}
                className="input"
              >
                <option value="bank">Bank account</option>
                <option value="mobile">Mobile money</option>
                <option value="crypto">Crypto wallet</option>
              </select>
            </Field>
            <Field label="Preferred speed">
              <select value={pref} onChange={(e) => setPref(e.target.value as typeof pref)} className="input">
                <option value="best">Best overall</option>
                <option value="cheapest">Cheapest</option>
                <option value="fastest">Fastest</option>
                <option value="reliable">Most reliable</option>
              </select>
            </Field>
          </div>

          {/* Recipient name — locked & auto-filled when auto-resolve is on. */}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={nameLocked ? "Recipient name (auto-verified)" : "Recipient name"}>
              <div className="relative">
                <input
                  value={recipientName}
                  onChange={(e) => !nameLocked && setRecipientName(e.target.value)}
                  className="input pr-9"
                  placeholder={
                    nameLocked
                      ? resolveState.kind === "loading"
                        ? "Verifying account…"
                        : "Enter bank & account number to auto-fill"
                      : "Full name of recipient"
                  }
                  readOnly={nameLocked}
                  disabled={nameLocked && resolveState.kind === "loading"}
                />
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  {nameLocked && resolveState.kind === "loading" && (
                    <Loader2 size={16} className="animate-spin text-muted-foreground" />
                  )}
                  {nameLocked && resolveState.kind === "ok" && <ShieldCheck size={16} className="text-emerald-500" />}
                  {nameLocked && resolveState.kind === "error" && <AlertCircle size={16} className="text-destructive" />}
                </div>
              </div>
              {nameLocked && resolveState.kind === "ok" && (
                <span className="mt-1 block text-[11px] text-emerald-500">✓ Verified with NIBSS · {bankLabel}</span>
              )}
            </Field>
            <div className="hidden md:block" />
          </div>

          <div className="rounded-xl border border-border/60 bg-surface/40 p-3">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Setup progress</div>
            <div className="flex flex-wrap gap-2">
              {subSteps.map((s, i) => (
                <div
                  key={s.key}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
                    s.done ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  <span
                    className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${
                      s.done ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {s.done ? <Check size={9} /> : i + 1}
                  </span>
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border/60 bg-surface/60 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary text-[11px]">
                {recipient === "bank" ? "🏦" : recipient === "mobile" ? "📱" : "🪙"}
              </span>
              <span>{recipientInstructions}</span>
            </div>

            {recipient === "bank" && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={`Bank in ${to.name}`} error={recipientErrors.bankName}>
                  {useLiveBanks ? (
                    <select
                      className="input"
                      value={bankCode}
                      onChange={(e) => {
                        const b = liveBanks.find((x) => x.code === e.target.value);
                        setBankCode(e.target.value);
                        setBankLabel(b?.name ?? "");
                      }}
                      disabled={banksLoading || !liveBanks.length}
                    >
                      <option value="">
                        {banksLoading ? "Loading banks…" : liveBanks.length ? "Select a bank…" : "No banks available"}
                      </option>
                      {liveBanks.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      className="input"
                      value={bankLabel}
                      onChange={(e) => {
                        setBankLabel(e.target.value);
                        setBankCode(e.target.value); // synthetic code = label for demo corridors
                      }}
                    >
                      <option value="">Select a bank…</option>
                      {staticBanks.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  )}
                  {banksError && <span className="mt-1 block text-[11px] text-amber-500">{banksError}</span>}
                </Field>
                <Field label="Account number" error={recipientErrors.bankAccount}>
                  <input
                    className="input"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder={autoResolveEnabled ? "10-digit NUBAN e.g. 0123456789" : "Enter account number"}
                    inputMode="numeric"
                    maxLength={20}
                  />
                </Field>
              </div>
            )}

            {recipient === "mobile" && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={`Mobile money provider (${to.name})`} error={recipientErrors.momoProvider}>
                  {availableMomo.length ? (
                    <select
                      className="input"
                      value={momoProvider}
                      onChange={(e) => setMomoProvider(e.target.value)}
                    >
                      <option value="">Select a provider…</option>
                      {availableMomo.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="input"
                      value={momoProvider}
                      onChange={(e) => setMomoProvider(e.target.value)}
                      placeholder="Provider name"
                    />
                  )}
                </Field>
                <Field label="Recipient phone number" error={recipientErrors.momoPhone}>
                  <input
                    className="input"
                    value={momoPhone}
                    onChange={(e) => setMomoPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    inputMode="tel"
                  />
                </Field>
              </div>
            )}

            {recipient === "crypto" && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Network / asset">
                  <select className="input" value={cryptoNetwork} onChange={(e) => setCryptoNetwork(e.target.value)}>
                    {CRYPTO_NETWORKS.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Wallet address" error={recipientErrors.cryptoAddress}>
                  <input
                    className="input font-mono text-xs"
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value.trim())}
                    placeholder={CRYPTO_NETWORKS.find((n) => n.id === cryptoNetwork)?.hint}
                  />
                </Field>
              </div>
            )}

            {recipientValid && (
              <div className="text-xs text-muted-foreground">
                Payout summary: <span className="font-mono text-foreground">{recipientDetails}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              {canProceed ? (
                <>
                  Routing <span className="font-medium text-primary">{quotes.length}</span> providers · {from.flag}{" "}
                  {from.currency} → {to.flag} {to.currency}
                </>
              ) : (
                <>Complete the recipient details to see live route comparison.</>
              )}
            </div>
            <button className="btn-primary" onClick={proceedToQuotes} disabled={!canProceed}>
              Compare routes →
            </button>
          </div>
        </div>
      )}

      {step === "quotes" && (
        <div className="space-y-4">
          <div className="card-glass flex items-start gap-3 p-4">
            <div className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-primary/10 text-primary">✨</div>
            <div>
              <div className="text-sm font-semibold">AI route recommendation</div>
              <p className="text-sm text-muted-foreground">{aiRecommendation(filteredQuotes)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["best", "cheapest", "fastest", "reliable"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPref(p)}
                className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
                  pref === p
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "best" ? "Best overall" : p}
              </button>
            ))}
          </div>

          <div className="grid gap-3">
            {filteredQuotes.map((q) => (
              <QuoteCard
                key={q.provider.id}
                q={q}
                selected={selected?.provider.id === q.provider.id}
                onSelect={() => setSelected(q)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button className="btn-ghost" onClick={() => setStep("form")}>
              ← Back
            </button>
            <button className="btn-primary" onClick={() => setStep("review")} disabled={!selected}>
              Review & confirm
            </button>
          </div>
        </div>
      )}

      {step === "review" && selected && (
        <div className="card-glass space-y-4 p-6">
          <h2 className="text-xl font-semibold">Confirm transfer</h2>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <Row label="From" v={`${from.flag} ${from.name}`} />
            <Row label="To" v={`${to.flag} ${to.name}`} />
            <Row label="Recipient" v={`${recipientName} · ${recipientDetails}`} />
            <Row label="Provider" v={selected.provider.name} />
            <Row label="You send" v={formatCurrency(amount, "USD")} />
            <Row label="Fee" v={formatCurrency(selected.feeUSD, "USD")} />
            <Row label="FX rate" v={`1 USD = ${selected.fxRate.toFixed(4)} ${to.currency}`} />
            <Row label="Delivery" v={formatEta(selected.etaMinutes)} />
            <Row label="Recipient gets" v={formatCurrency(selected.recipientAmount, to.currency)} highlight />
          </div>
          <div className="rounded-lg border border-border/60 bg-surface p-3 text-xs text-muted-foreground">
            Executed via Rialo Workflow. Async & Reactive Transactions handle provider confirmation; Interop settles
            across chains where needed; IPC runs KYC/AML screening; REX protects sensitive recipient data.
          </div>
          <div className="flex items-center justify-between pt-2">
            <button className="btn-ghost" onClick={() => setStep("quotes")}>
              ← Back
            </button>
            <button className="btn-primary" onClick={confirmTransfer}>
              Approve & execute
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="card-glass space-y-4 p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/20 text-2xl text-primary pulse-dot">
            ✓
          </div>
          <h2 className="text-2xl font-semibold">Transfer routed</h2>
          <p className="text-sm text-muted-foreground">
            CorridorX is executing your payment. Follow it live on the transfers page.
          </p>
          <div className="flex justify-center gap-2">
            <button
              className="btn-ghost"
              onClick={() => {
                setStep("form");
                setCreatedId(null);
              }}
            >
              Send another
            </button>
            <button className="btn-primary" onClick={() => navigate({ to: "/app/transfers" })}>
              Track transfer{createdId ? " →" : ""}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          padding: 0.65rem 0.85rem;
          border-radius: 0.6rem;
          background: var(--color-input);
          border: 1px solid var(--color-border);
          color: var(--color-foreground);
          font-size: 0.9rem;
          outline: none;
          transition: border-color .15s;
        }
        .input:focus { border-color: var(--color-primary); }
        .input:read-only { opacity: 0.9; }
      `}</style>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: Step[] = ["form", "quotes", "review", "done"];
  const labels = ["Details", "Routes", "Review", "Done"];
  const idx = steps.indexOf(step);
  return (
    <div className="hidden items-center gap-2 md:flex">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-2">
          <div
            className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold ${
              i <= idx ? "bg-primary text-primary-foreground" : "bg-surface-elevated text-muted-foreground"
            }`}
          >
            {i + 1}
          </div>
          <span className={`text-xs ${i <= idx ? "text-foreground" : "text-muted-foreground"}`}>{l}</span>
          {i < labels.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
        </div>
      ))}
    </div>
  );
}

function CountrySelect({ label, value, onChange }: { label: string; value: Country; onChange: (c: Country) => void }) {
  return (
    <Field label={label}>
      <select
        className="input"
        value={value.code}
        onChange={(e) => {
          const c = COUNTRIES.find((x) => x.code === e.target.value);
          if (c) onChange(c);
        }}
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name} ({c.currency})
          </option>
        ))}
      </select>
    </Field>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}

function Row({ label, v, highlight }: { label: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ${highlight ? "text-lg font-semibold text-gradient" : ""}`}>{v}</span>
    </div>
  );
}

function QuoteCard({ q, selected, onSelect }: { q: Quote; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`card-glass w-full text-left transition ${
        selected ? "outline outline-2 outline-primary" : "hover:border-primary/50"
      }`}
    >
      <div className="flex flex-wrap items-center gap-4 p-4">
        <div
          className="grid h-11 w-11 flex-none place-items-center rounded-xl text-lg font-bold"
          style={{ background: `${q.provider.color}22`, color: q.provider.color }}
        >
          {q.provider.logo}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{q.provider.name}</span>
            {q.tags.map((t) => (
              <span
                key={t}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  t === "Best Overall" ? "bg-primary text-primary-foreground" : "border border-primary/40 text-primary"
                }`}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">{q.provider.network}</div>
        </div>
        <div className="grid flex-none grid-cols-3 gap-4 text-right text-xs">
          <div>
            <div className="text-muted-foreground">Fee</div>
            <div className="font-mono text-sm text-foreground">${q.feeUSD.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Delivery</div>
            <div className="font-mono text-sm text-foreground">{formatEta(q.etaMinutes)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Recipient gets</div>
            <div className="font-mono text-sm font-semibold text-gradient">
              {formatCurrency(q.recipientAmount, q.currency)}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
