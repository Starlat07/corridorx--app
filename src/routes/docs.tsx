import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeProvider";
import {
  ArrowRight,
  Banknote,
  Bitcoin,
  BookOpen,
  Building2,
  CheckCircle2,
  Cog,
  Fingerprint,
  Globe2,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  Lock,
  Phone,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/docs")({
  component: Docs,
  head: () => ({
    meta: [
      { title: "CorridorX Docs — Cross-border transfer routing" },
      {
        name: "description",
        content:
          "Complete documentation for CorridorX: how the routing engine works, supported payout methods, bank account verification, security, and API reference.",
      },
      { property: "og:title", content: "CorridorX Docs" },
      { property: "og:description", content: "Learn how CorridorX routes cross-border payments across banks, mobile money, and crypto rails." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const TOC: { id: string; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "intro", label: "Introduction", icon: BookOpen },
  { id: "quickstart", label: "Quick start", icon: Rocket },
  { id: "concepts", label: "Core concepts", icon: Sparkles },
  { id: "payouts", label: "Payout methods", icon: Send },
  { id: "bank-verification", label: "Bank account verification", icon: ShieldCheck },
  { id: "corridors", label: "Supported corridors", icon: Globe2 },
  { id: "routing", label: "Routing engine", icon: Cog },
  { id: "transfers", label: "Transfer lifecycle", icon: LineChart },
  { id: "dashboard", label: "Using the dashboard", icon: LayoutDashboard },
  { id: "security", label: "Security", icon: Lock },
  { id: "api", label: "API reference", icon: KeyRound },
  { id: "faq", label: "FAQ", icon: LifeBuoy },
];

function Section({
  id,
  title,
  eyebrow,
  children,
}: {
  id: string;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border/60 py-12 first:border-t-0 first:pt-4">
      {eyebrow && (
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</div>
      )}
      <h2 className="mb-4 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-foreground/85">{children}</div>
    </section>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/50 p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon size={16} />
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border/60 bg-surface/70 p-4 text-[12.5px] leading-relaxed text-foreground/90">
      <code>{children}</code>
    </pre>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border border-border/70 bg-surface/60 px-1.5 py-0.5 text-[12px] font-mono text-foreground/90">
      {children}
    </code>
  );
}

function Docs() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={26} />
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">/ Docs</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/app"
              className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent sm:inline-flex"
            >
              Open app <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-10 md:px-6 lg:grid-cols-[240px_1fr]">
        {/* TOC */}
        <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Documentation
          </div>
          <nav className="space-y-1">
            {TOC.map((t) => {
              const Icon = t.icon;
              return (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/75 hover:bg-accent hover:text-foreground"
                >
                  <Icon size={14} />
                  {t.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <article className="min-w-0">
          <div className="mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">CorridorX v1</div>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight md:text-5xl">Documentation</h1>
            <p className="mt-3 max-w-2xl text-[15px] text-muted-foreground">
              Everything you need to route, send, verify, and track cross-border transfers using CorridorX — an AI
              routing layer over banks, mobile money, and crypto rails.
            </p>
          </div>

          <Section id="intro" eyebrow="Overview" title="What is CorridorX?">
            <p>
              CorridorX is a cross-border payment router. You describe a transfer — where it's going, how the recipient
              wants to receive it, and how much — and CorridorX quotes every eligible provider (Circle + Rialo,
              Flutterwave, Wise, RemitClassic, and traditional bank wires), ranks them by cost, speed, and reliability,
              and executes through the winning rail.
            </p>
            <p>
              The app is designed for real-world money movement across three payout families: <strong>bank accounts</strong>,{" "}
              <strong>mobile money wallets</strong>, and <strong>crypto wallets</strong>. Live bank data is powered by
              Paystack (Nigeria) and Flutterwave (Ghana, Kenya, South Africa, Uganda, Tanzania).
            </p>
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              <Card icon={Zap} title="Instant quotes">
                Real-time fees, FX, ETA, and recipient receive-amount across five providers.
              </Card>
              <Card icon={ShieldCheck} title="Verified recipients">
                NUBAN name enquiry for Nigerian accounts via Paystack before you send.
              </Card>
              <Card icon={LineChart} title="Live tracking">
                Progress steps and status timeline for every transfer.
              </Card>
            </div>
          </Section>

          <Section id="quickstart" eyebrow="Get started" title="Quick start">
            <ol className="ml-5 list-decimal space-y-2">
              <li>
                Click <Kbd>Connect</Kbd> on the landing page and create an account (email + password).
              </li>
              <li>
                Open the sidebar (hamburger icon) and go to <Kbd>Send Money</Kbd>.
              </li>
              <li>Pick sender and recipient countries, enter the USD amount, and choose a payout type.</li>
              <li>
                Fill in the recipient details. For Nigerian bank transfers the recipient's name auto-fills after you
                enter the 10-digit NUBAN.
              </li>
              <li>
                Review the ranked route list, pick the recommended provider (or override with Cheapest / Fastest /
                Reliable), and confirm.
              </li>
              <li>
                Watch the transfer progress live on the <Kbd>Transfer History</Kbd> page.
              </li>
            </ol>
          </Section>

          <Section id="concepts" eyebrow="Concepts" title="Core concepts">
            <div className="grid gap-3 sm:grid-cols-2">
              <Card icon={Globe2} title="Corridor">
                A directed pair of countries plus a currency (e.g. US → NG in NGN). Determines which providers and
                payout methods are eligible.
              </Card>
              <Card icon={Send} title="Payout method">
                How the recipient receives funds: bank, mobile money, or crypto. Drives the required form fields and
                validation.
              </Card>
              <Card icon={Cog} title="Quote">
                A provider's offer for one transfer — includes fee, FX rate, recipient amount, ETA, reliability, and a
                composite score.
              </Card>
              <Card icon={LineChart} title="Route">
                The winning provider + rail selected for a transfer. Routes are re-evaluated on every quote request.
              </Card>
            </div>
          </Section>

          <Section id="payouts" eyebrow="Payout methods" title="Payout methods & required fields">
            <p>
              The Send form is a guided stepper that updates automatically based on your payout choice. Fields shown,
              validators used, and instructions all change in response.
            </p>

            <div className="mt-2 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-surface/50 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Building2 size={18} className="text-primary" /> <strong>Bank account</strong>
                </div>
                <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Bank (live list per country)</li>
                  <li>Account number (6–20 digits)</li>
                  <li>Recipient name (auto-verified for Nigeria)</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border/60 bg-surface/50 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Phone size={18} className="text-primary" /> <strong>Mobile money</strong>
                </div>
                <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Provider (M-Pesa, MTN MoMo, OPay, GCash, etc.)</li>
                  <li>Phone in international format (+2348012345678)</li>
                  <li>Recipient name</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border/60 bg-surface/50 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Bitcoin size={18} className="text-primary" /> <strong>Crypto wallet</strong>
                </div>
                <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Network (USDC Base, USDC Solana, USDT Tron, BTC)</li>
                  <li>Wallet address (validated per network)</li>
                  <li>Recipient name / label</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section id="bank-verification" eyebrow="Verification" title="Bank account name verification">
            <p>
              For Nigerian bank transfers, CorridorX performs a live NUBAN name enquiry against Paystack's{" "}
              <code>/bank/resolve</code> endpoint. The recipient's registered name is auto-filled and locked so you
              can't accidentally send money to the wrong person.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card icon={Banknote} title="Nigeria (primary: Paystack)">
                Live bank list from Paystack. Account resolution via NIBSS with Flutterwave as fallback.
              </Card>
              <Card icon={Fingerprint} title="Ghana / Kenya / South Africa / Uganda / Tanzania">
                Live bank list from Flutterwave. Recipient name is entered manually — automatic resolution requires
                enterprise KYC in those markets.
              </Card>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>How it works under the hood:</strong> when you enter a 10-digit account number, the client
              debounces 600 ms, then calls the <code>resolveBankAccount</code> server function. The server hits Paystack
              with your bank code + account number and returns the verified holder name. Results are cached for 24 hours
              to avoid duplicate lookups.
            </p>
            <Code>{`// src/lib/banks.functions.ts
export const resolveBankAccount = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    country: z.string().length(2),
    bankCode: z.string(),
    accountNumber: z.string(),
  }).parse(d))
  .handler(async ({ data }) => {
    // Paystack primary, Flutterwave fallback for Nigeria
    const r = await resolveWithPaystack(data.bankCode, data.accountNumber);
    return r.ok
      ? { resolved: true, name: r.name }
      : { resolved: false, reason: r.reason };
  });`}</Code>
          </Section>

          <Section id="corridors" eyebrow="Coverage" title="Supported corridors">
            <p>
              Sender and recipient can be any of the countries below. Provider coverage varies — the router filters to
              only providers that support the chosen payout method.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-surface/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Country</th>
                    <th className="px-4 py-2">Currency</th>
                    <th className="px-4 py-2">Live bank list</th>
                    <th className="px-4 py-2">Name enquiry</th>
                    <th className="px-4 py-2">Mobile money</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {[
                    ["🇳🇬 Nigeria", "NGN", "Paystack", "Paystack (NIBSS)", "OPay, PalmPay, MoniePoint"],
                    ["🇰🇪 Kenya", "KES", "Flutterwave", "Manual", "M-Pesa, Airtel Money"],
                    ["🇬🇭 Ghana", "GHS", "Flutterwave", "Manual", "MTN MoMo, Vodafone Cash"],
                    ["🇿🇦 South Africa", "ZAR", "Flutterwave", "Manual", "MTN MoMo, Vodacom"],
                    ["🇮🇳 India", "INR", "—", "Manual", "Paytm, PhonePe, GPay"],
                    ["🇺🇸 United States", "USD", "—", "Manual", "Venmo, Cash App, Zelle"],
                    ["🇬🇧 United Kingdom", "GBP", "—", "Manual", "Revolut, Monzo"],
                    ["🇪🇺 Eurozone", "EUR", "—", "Manual", "Revolut, Wise"],
                    ["🇵🇭 Philippines", "PHP", "—", "Manual", "GCash, PayMaya"],
                    ["🇲🇽 Mexico", "MXN", "—", "Manual", "Mercado Pago, Oxxo Pay"],
                  ].map((r) => (
                    <tr key={r[0]}>
                      {r.map((c, i) => (
                        <td key={i} className="px-4 py-2">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="routing" eyebrow="Engine" title="How the routing engine works">
            <p>
              For each quote request the engine evaluates every provider that supports the chosen payout method and
              computes:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Fee</strong> — <code>amount × feePct + feeFlat</code>
              </li>
              <li>
                <strong>Effective FX</strong> — mid-market × <code>(1 − spread)</code>
              </li>
              <li>
                <strong>Recipient amount</strong> — <code>(amount − fee) × effectiveFx</code>
              </li>
              <li>
                <strong>Total cost</strong> — <code>fee + amount × spread</code> (in USD)
              </li>
              <li>
                <strong>Score</strong> — weighted composite: 50% cost, 30% speed, 20% reliability
              </li>
            </ul>
            <p>
              Routes are tagged automatically: <Kbd>Cheapest</Kbd>, <Kbd>Fastest</Kbd>, <Kbd>Most Reliable</Kbd>, and{" "}
              <Kbd>Best Overall</Kbd>. The Best Overall route is highlighted as the recommendation, but you can always
              override.
            </p>
          </Section>

          <Section id="transfers" eyebrow="Lifecycle" title="Transfer lifecycle">
            <p>Every transfer moves through a deterministic state machine:</p>
            <div className="flex flex-wrap items-center gap-2 py-2 text-xs">
              {["Initiated", "Processing", "Awaiting provider", "Completed"].map((s, i, arr) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-medium text-primary">
                    {s}
                  </span>
                  {i < arr.length - 1 && <ArrowRight size={14} className="text-muted-foreground" />}
                </div>
              ))}
            </div>
            <p>
              The <Kbd>Transfer History</Kbd> page polls active transfers and updates progress steps and the timeline in
              real time. A failed transfer surfaces the provider's reason and the retry path.
            </p>
          </Section>

          <Section id="dashboard" eyebrow="App" title="Using the dashboard">
            <div className="grid gap-3 sm:grid-cols-2">
              <Card icon={LayoutDashboard} title="Dashboard">
                Snapshot of active transfers, this month's volume, and provider mix.
              </Card>
              <Card icon={Send} title="Send Money">
                The guided send flow — form, quotes, review, done.
              </Card>
              <Card icon={LineChart} title="Compare Routes">
                Standalone comparison view with fee, FX, ETA, recipient amount, and a highlighted recommendation.
              </Card>
              <Card icon={CheckCircle2} title="Analytics">
                Trends, corridor usage, money saved vs. traditional wires, and provider performance charts.
              </Card>
            </div>
          </Section>

          <Section id="security" eyebrow="Security" title="Security & data">
            <ul className="ml-5 list-disc space-y-2">
              <li>Authentication uses Supabase (email + password). Google sign-in is coming soon.</li>
              <li>
                Provider API keys (Paystack, Flutterwave) are stored as server-side secrets and never leave the server.
                The browser never sees them.
              </li>
              <li>
                Bank name enquiries are proxied through server functions — the client only sends the country, bank
                code, and account number.
              </li>
              <li>Row-level security is enforced on every user-facing table so users only ever see their own data.</li>
              <li>
                Recipient details are validated client- and server-side: NUBAN length, international phone format, and
                per-network crypto address regex.
              </li>
            </ul>
          </Section>

          <Section id="api" eyebrow="Reference" title="Server API">
            <p>
              CorridorX exposes typed server functions via TanStack Start. They're called with{" "}
              <code>useServerFn</code> and are fully type-safe end to end.
            </p>
            <h3 className="pt-2 text-sm font-semibold">listBanks</h3>
            <Code>{`import { useServerFn } from "@tanstack/react-start";
import { listBanks } from "@/lib/banks.functions";

const fn = useServerFn(listBanks);
const { supported, banks } = await fn({ data: { country: "NG" } });
// banks: [{ code: "058", name: "Guaranty Trust Bank" }, ...]`}</Code>

            <h3 className="pt-4 text-sm font-semibold">resolveBankAccount</h3>
            <Code>{`const fn = useServerFn(resolveBankAccount);
const res = await fn({
  data: { country: "NG", bankCode: "058", accountNumber: "0123456789" },
});
if (res.resolved) console.log(res.name); // "JOHN ADEBAYO DOE"
else console.warn(res.reason);`}</Code>

            <h3 className="pt-4 text-sm font-semibold">Errors</h3>
            <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
              <li>
                <code>resolved: false</code> with a human-readable <code>reason</code> — display to the user.
              </li>
              <li>Rate-limit / provider outage — retried transparently against the fallback provider.</li>
              <li>Invalid input (wrong length, non-numeric NUBAN) — rejected client-side before the request.</li>
            </ul>
          </Section>

          <Section id="faq" eyebrow="Help" title="FAQ">
            <details className="rounded-xl border border-border/60 bg-surface/40 p-4">
              <summary className="cursor-pointer text-sm font-medium">Why can't I auto-verify Kenyan or Ghanaian accounts?</summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Name enquiry APIs in those markets require enterprise KYC agreements with the local switch (KEPSS,
                GhIPSS). We surface the live bank list and validate account number length, but the recipient name is
                entered manually.
              </p>
            </details>
            <details className="rounded-xl border border-border/60 bg-surface/40 p-4">
              <summary className="cursor-pointer text-sm font-medium">Can I send crypto to any wallet?</summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Yes — CorridorX validates the address per network before submission. USDC on Base and Solana settle in
                seconds; USDT on Tron and BTC follow their native rails.
              </p>
            </details>
            <details className="rounded-xl border border-border/60 bg-surface/40 p-4">
              <summary className="cursor-pointer text-sm font-medium">How are provider fees updated?</summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Fee and spread values are refreshed on every quote request. Rate cards live in{" "}
                <code>src/lib/corridorx.ts</code> and can be swapped for live provider APIs without changing the routing
                engine.
              </p>
            </details>
            <details className="rounded-xl border border-border/60 bg-surface/40 p-4">
              <summary className="cursor-pointer text-sm font-medium">Is CorridorX regulated?</summary>
              <p className="mt-2 text-sm text-muted-foreground">
                CorridorX is a routing layer — money movement is executed by licensed providers (Paystack, Flutterwave,
                Circle, Wise). Their licenses and consumer protections apply to the underlying transfer.
              </p>
            </details>
          </Section>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <div>
              <div className="text-sm font-semibold">Ready to route your first transfer?</div>
              <div className="text-xs text-muted-foreground">Open the app and send in under a minute.</div>
            </div>
            <Link
              to="/app/send"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Send money <ArrowRight size={14} />
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
