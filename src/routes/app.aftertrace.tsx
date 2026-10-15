import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  Clock3,
  Coins,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";
import {
  COUNTRIES,
  formatCurrency,
  formatEta,
  getQuotes,
  type Country,
  type RecipientType,
} from "@/lib/corridorx";
import {
  evaluateRoutes,
  listOutcomes,
  recordOutcome,
  validateIntent,
  type PaymentIntent,
  type Priority,
  type RouteOutcome,
} from "@/lib/aftertrace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/aftertrace")({
  component: Aftertrace,
  head: () => ({ meta: [{ title: "Aftertrace — CorridorX" }] }),
});

function Aftertrace() {
  const [from, setFrom] = useState<Country>(COUNTRIES[0]);
  const [to, setTo] = useState<Country>(COUNTRIES[1]);
  const [amount, setAmount] = useState(500);
  const [receive, setReceive] = useState(750000);
  const [maxFee, setMaxFee] = useState(15);
  const [hours, setHours] = useState(24);
  const [recipient, setRecipient] = useState<RecipientType>("bank");
  const [priority, setPriority] = useState<Priority>("reliability");
  const [userKey, setUserKey] = useState("local-demo");
  const [outcomes, setOutcomes] = useState<RouteOutcome[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [actualFee, setActualFee] = useState("");
  const [actualMinutes, setActualMinutes] = useState("");
  const [actualReceived, setActualReceived] = useState("");
  const [status, setStatus] = useState<"completed" | "failed" | "unconfirmed">("unconfirmed");
  const [reason, setReason] = useState("");
  const [tab, setTab] = useState<"route" | "memory">("route");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserKey(data.user?.id ?? "local-demo"));
  }, []);
  useEffect(() => {
    setOutcomes(listOutcomes(userKey));
  }, [userKey]);
  useEffect(() => {
    const refresh = () => setOutcomes(listOutcomes(userKey));
    window.addEventListener("corridorx:aftertrace", refresh);
    return () => window.removeEventListener("corridorx:aftertrace", refresh);
  }, [userKey]);

  const intent = useMemo<PaymentIntent>(
    () => ({
      from,
      to,
      amount,
      recipientAmount: receive,
      maxFee,
      deadlineHours: hours,
      recipient,
      priority,
    }),
    [from, to, amount, receive, maxFee, hours, recipient, priority],
  );
  const validation = validateIntent(intent);
  const routes = useMemo(
    () => evaluateRoutes(intent, getQuotes(from, to, amount, recipient), outcomes),
    [intent, from, to, amount, recipient, outcomes],
  );
  const recommended =
    routes.eligible.find((x) => x.quote.provider.id === selected) ?? routes.eligible[0];
  const successCount = outcomes.filter((o) => o.status === "completed").length;

  function runSearch() {
    setErrors(validation);
    if (!validation.length) {
      setSelected(null);
      setSavedId(null);
    }
  }
  function saveResult() {
    if (!recommended) return;
    const id = savedId ?? crypto.randomUUID();
    const outcome: RouteOutcome = {
      id,
      userKey,
      recordedAt: Date.now(),
      routeId: recommended.quote.provider.id,
      routeName: recommended.quote.provider.name,
      fromCode: from.code,
      toCode: to.code,
      senderAmount: amount,
      recipient,
      quotedFee: recommended.quote.feeUSD,
      actualFee: status === "unconfirmed" || actualFee === "" ? null : Number(actualFee),
      estimatedMinutes: recommended.quote.etaMinutes,
      actualMinutes: status === "completed" && actualMinutes !== "" ? Number(actualMinutes) : null,
      intendedRecipientAmount: receive,
      actualRecipientAmount:
        status === "completed" && actualReceived !== "" ? Number(actualReceived) : null,
      status,
      reason: reason.trim(),
      source: "user-confirmed",
    };
    const result = recordOutcome(outcome);
    setOutcomes(result.outcomes);
    setSavedId(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Waypoints size={14} /> Outcome based routing
          </div>
          <h1 className="text-3xl font-semibold">Aftertrace</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            You define what this payment must achieve. Aftertrace learns from confirmed outcomes and
            recommends a route that fits.
          </p>
        </div>
        <div
          className="flex rounded-xl border border-border p-1"
          role="tablist"
          aria-label="Aftertrace views"
        >
          <button
            className={`rounded-lg px-3 py-2 text-sm ${tab === "route" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            onClick={() => setTab("route")}
          >
            Plan a payment
          </button>
          <button
            className={`rounded-lg px-3 py-2 text-sm ${tab === "memory" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            onClick={() => setTab("memory")}
          >
            Route Memory{" "}
            <span className="ml-1 rounded-full bg-background/20 px-1.5 text-xs">
              {outcomes.length}
            </span>
          </button>
        </div>
      </div>
      {tab === "route" ? (
        <>
          <section className="card-glass p-5 md:p-6" aria-labelledby="intent-title">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <ArrowDownLeft size={20} />
              </div>
              <div>
                <h2 id="intent-title" className="font-semibold">
                  Payment intent
                </h2>
                <p className="text-xs text-muted-foreground">
                  Set the recipient outcome and your non-negotiable limits.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Send from">
                <select
                  className="input"
                  value={from.code}
                  onChange={(e) => setFrom(COUNTRIES.find((c) => c.code === e.target.value)!)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} · {c.currency}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Destination">
                <select
                  className="input"
                  value={to.code}
                  onChange={(e) => {
                    const c = COUNTRIES.find((x) => x.code === e.target.value)!;
                    setTo(c);
                    setReceive(Math.round(((amount * c.rate) / from.rate) * 0.95));
                  }}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} · {c.currency}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`Sending amount (${from.currency})`}>
                <input
                  className="input"
                  type="number"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </Field>
              <Field label={`Recipient must receive (${to.currency})`}>
                <input
                  className="input"
                  type="number"
                  min="0.01"
                  value={receive}
                  onChange={(e) => setReceive(Number(e.target.value))}
                />
              </Field>
              <Field label={`Maximum route fee (${from.currency})`}>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={maxFee}
                  onChange={(e) => setMaxFee(Number(e.target.value))}
                />
              </Field>
              <Field label="Delivery window">
                <select
                  className="input"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                >
                  <option value={1}>Within 1 hour</option>
                  <option value={6}>Within 6 hours</option>
                  <option value={24}>Within 24 hours</option>
                  <option value={72}>Within 3 days</option>
                  <option value={168}>Within 7 days</option>
                </select>
              </Field>
              <Field label="Payout method">
                <select
                  className="input"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value as RecipientType)}
                >
                  <option value="bank">Bank account</option>
                  <option value="mobile">Mobile money</option>
                  <option value="crypto">Crypto wallet</option>
                </select>
              </Field>
              <Field label="What matters most?">
                <select
                  className="input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                >
                  <option value="reliability">Predictable delivery</option>
                  <option value="cost">Lower overall cost</option>
                  <option value="speed">Faster delivery</option>
                </select>
              </Field>
            </div>
            {errors.length > 0 && (
              <div
                className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                role="alert"
              >
                {validation.map((e) => (
                  <p key={e}>{e}</p>
                ))}
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Quotes are indicative estimates; provider completion and delivery are not
                guaranteed.
              </p>
              <button className="btn-primary" onClick={runSearch}>
                Compare routes <ArrowRight className="ml-1 inline" size={16} />
              </button>
            </div>
          </section>
          <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <section className="space-y-3" aria-label="Route recommendations">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Routes for this intent</h2>
                  <p className="text-xs text-muted-foreground">
                    Hard limits are applied before preferences influence ranking.
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {routes.eligible.length} eligible
                </span>
              </div>
              {recommended && (
                <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                        <Sparkles size={14} /> Aftertrace recommends
                      </div>
                      <h3 className="text-xl font-semibold">{recommended.quote.provider.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {recommended.quote.provider.network} · Simulated quote
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Recipient estimate</p>
                      <p className="text-2xl font-semibold text-primary">
                        {formatCurrency(recommended.quote.recipientAmount, to.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <Stat
                      icon={Coins}
                      label="Quoted fee"
                      value={formatCurrency(recommended.quote.feeUSD, from.currency)}
                    />
                    <Stat
                      icon={Clock3}
                      label="Delivery estimate"
                      value={formatEta(recommended.quote.etaMinutes)}
                    />
                    <Stat
                      icon={ShieldCheck}
                      label="Evidence"
                      value={
                        recommended.evidence.observations < 5
                          ? "Limited"
                          : `${recommended.evidence.observations} outcomes`
                      }
                    />
                  </div>
                  <ul className="mt-4 space-y-2 rounded-xl border border-border bg-background/70 p-4 text-sm">
                    {recommended.explanation.map((x, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary">✓</span>
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!recommended && (
                <div className="card-glass p-5">
                  <h3 className="font-semibold">No route meets every requirement</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Closest options are listed with the exact unmet condition. Adjust the fee,
                    delivery, or recipient amount requirement to see eligible routes.
                  </p>
                </div>
              )}
              {routes.eligible.map((x) => (
                <button
                  key={x.quote.provider.id}
                  onClick={() => setSelected(x.quote.provider.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${recommended?.quote.provider.id === x.quote.provider.id ? "border-primary/50 bg-primary/5" : "border-border bg-background hover:bg-accent/50"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        {x.quote.provider.name}{" "}
                        <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          SIMULATED
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatEta(x.quote.etaMinutes)} · {x.evidence.observations} relevant
                        outcomes
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(x.quote.recipientAmount, to.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        fee {formatCurrency(x.quote.feeUSD, from.currency)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {routes.excluded.length > 0 && (
                <details className="card-glass p-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    Closest alternatives that miss a requirement ({routes.excluded.length})
                  </summary>
                  <div className="mt-3 space-y-3">
                    {routes.excluded.map((x) => (
                      <div
                        key={x.quote.provider.id}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="font-medium">
                          {x.quote.provider.name}{" "}
                          <span className="text-xs text-muted-foreground">· Not eligible</span>
                        </div>
                        <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                          {x.reasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </section>
            <section className="card-glass h-fit p-5">
              <div className="mb-4 flex items-center gap-2">
                <Activity size={18} className="text-primary" />
                <h2 className="font-semibold">Close the learning loop</h2>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                After the route finishes, record what you can confirm. Pending or unknown results
                stay unconfirmed and never count as successful outcomes.
              </p>
              {recommended ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Final status">
                      <select
                        className="input"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as typeof status)}
                      >
                        <option value="completed">Completed · confirmed</option>
                        <option value="failed">Failed · confirmed</option>
                        <option value="unconfirmed">Pending / unknown</option>
                      </select>
                    </Field>
                    <Field label="Actual fee (if known)">
                      <input
                        className="input"
                        type="number"
                        min="0"
                        disabled={status === "unconfirmed"}
                        value={actualFee}
                        onChange={(e) => setActualFee(e.target.value)}
                      />
                    </Field>
                    <Field label="Actual delivery minutes">
                      <input
                        className="input"
                        type="number"
                        min="0"
                        disabled={status !== "completed"}
                        value={actualMinutes}
                        onChange={(e) => setActualMinutes(e.target.value)}
                      />
                    </Field>
                    <Field label={`Actually received (${to.currency})`}>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        disabled={status !== "completed"}
                        value={actualReceived}
                        onChange={(e) => setActualReceived(e.target.value)}
                      />
                    </Field>
                  </div>
                  <Field label="Delay, failure, or rejection reason (optional)">
                    <input
                      className="input"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Add a reason if known"
                    />
                  </Field>
                  <button className="btn-primary w-full" disabled={!!savedId} onClick={saveResult}>
                    {savedId ? "Outcome recorded" : "Record outcome"}
                  </button>
                  <p className="text-[11px] text-muted-foreground">
                    Self-reported demo record · saved only in this browser and account profile.
                  </p>
                </div>
              ) : (
                <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  Select an eligible recommendation to enter an outcome.
                </p>
              )}
            </section>
          </div>
        </>
      ) : (
        <section className="space-y-5">
          <div className="card-glass grid gap-4 p-5 sm:grid-cols-3">
            <Metric label="Recorded outcomes" value={outcomes.length} />
            <Metric label="Confirmed completions" value={successCount} />
            <Metric
              label="Routes with evidence"
              value={
                new Set(outcomes.filter((o) => o.status !== "unconfirmed").map((o) => o.routeId))
                  .size
              }
            />
          </div>
          <div className="card-glass p-5">
            <h2 className="text-lg font-semibold">Memory for this account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Only confirmed, relevant outcomes influence future route ranking. History is matched
              by corridor, payout method, and a similar transfer size.
            </p>
            {outcomes.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-border p-8 text-center">
                <Waypoints className="mx-auto mb-3 text-primary" />
                <h3 className="font-semibold">Your Route Memory starts with your first outcome</h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  After a payment reaches a known final status, record its actual fee, delivery
                  time, and recipient amount. Until then, recommendations rely on current estimates
                  and disclose the lack of history.
                </p>
                <button className="btn-primary mt-4" onClick={() => setTab("route")}>
                  Define a payment intent
                </button>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-border text-xs text-muted-foreground">
                    <tr>
                      <th className="p-3">Route and corridor</th>
                      <th className="p-3">Status / source</th>
                      <th className="p-3">Quoted → actual fee</th>
                      <th className="p-3">Estimated → actual time</th>
                      <th className="p-3">Recipient outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outcomes.map((o) => (
                      <tr key={o.id} className="border-b border-border/60">
                        <td className="p-3 font-medium">
                          {o.routeName}
                          <div className="text-xs text-muted-foreground">
                            {o.fromCode} → {o.toCode} ·{" "}
                            {formatCurrency(
                              o.senderAmount,
                              COUNTRIES.find((c) => c.code === o.fromCode)?.currency ?? "USD",
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="rounded-full bg-muted px-2 py-1 text-xs">
                            {o.status}
                          </span>
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            User confirmed
                          </div>
                        </td>
                        <td className="p-3">
                          {formatCurrency(
                            o.quotedFee,
                            COUNTRIES.find((c) => c.code === o.fromCode)?.currency ?? "USD",
                          )}{" "}
                          →{" "}
                          {o.actualFee === null
                            ? "—"
                            : formatCurrency(
                                o.actualFee,
                                COUNTRIES.find((c) => c.code === o.fromCode)?.currency ?? "USD",
                              )}
                        </td>
                        <td className="p-3">
                          {formatEta(o.estimatedMinutes)} →{" "}
                          {o.actualMinutes === null ? "—" : formatEta(o.actualMinutes)}
                        </td>
                        <td className="p-3">
                          {o.actualRecipientAmount === null
                            ? "Unconfirmed"
                            : `${formatCurrency(o.actualRecipientAmount, COUNTRIES.find((c) => c.code === o.toCode)?.currency ?? "USD")} ${o.actualRecipientAmount >= o.intendedRecipientAmount ? "· met amount" : "· below intent"}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {outcomes.length > 0 && (
            <div className="card-glass p-5">
              <h2 className="font-semibold">What the evidence shows</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {Array.from(new Set(outcomes.map((o) => o.routeId))).map((id) => {
                  const r = outcomes.find((o) => o.routeId === id)!;
                  const n = outcomes.filter(
                    (o) => o.routeId === id && o.status !== "unconfirmed",
                  ).length;
                  return (
                    <div key={id} className="rounded-xl border border-border p-4">
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">{r.routeName}</span>
                        <span className="text-xs text-muted-foreground">{n} confirmed</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {n < 5
                          ? "Insufficient evidence for a reliable performance estimate."
                          : `${outcomes.filter((o) => o.routeId === id && o.status === "completed").length} completed of ${n} confirmed route outcomes.`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
      <p className="text-center text-xs text-muted-foreground">
        Demo quotes and local browser storage. No payment is initiated by Aftertrace. Provider APIs
        are not connected here.
      </p>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function Stat({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/70 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon size={13} />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
