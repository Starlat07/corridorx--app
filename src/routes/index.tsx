import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { ConnectModal } from "@/components/ConnectModal";
import { PROVIDERS } from "@/lib/corridorx";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "CorridorX — Intelligent routing for global payments" },
      { name: "description", content: "Compare every cross-border payment route in one place. CorridorX finds the cheapest, fastest, and most reliable corridor automatically." },
    ],
  }),
});

function Landing() {
  const [connectOpen, setConnectOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <header className="container-page flex h-16 items-center justify-between">
        <Logo size={30} />
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#providers" className="hover:text-foreground">Providers</a>
          <a href="#tech" className="hover:text-foreground">Infrastructure</a>
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={() => setConnectOpen(true)} className="btn-primary text-sm">Connect</button>
        </div>
      </header>
      <ConnectModal open={connectOpen} onClose={() => setConnectOpen(false)} />

      {/* Hero */}
      <section className="container-page relative py-16 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
            Powered by Rialo infrastructure
          </span>
          <h1 className="text-4xl font-semibold leading-[1.05] md:text-6xl">
            The intelligent <span className="text-primary">routing layer</span><br /> for global payments.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            CorridorX aggregates banks, fintech, stablecoins, and mobile money — then automatically executes the cheapest, fastest, and most reliable route for your transfer.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => setConnectOpen(true)} className="btn-primary">Connect to get started</button>
            <a href="#how" className="btn-ghost">See how it works</a>
          </div>
          <div className="mx-auto mt-12 grid max-w-md grid-cols-3 gap-4 text-sm">
            {[["120+", "corridors"], ["<2 min", "settlement"], ["0.3%", "avg. cost"]].map(([v, l]) => (
              <div key={l}>
                <div className="text-2xl font-semibold text-primary">{v}</div>
                <div className="text-xs text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="container-page py-16">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-semibold md:text-4xl">One request. Every corridor.</h2>
          <p className="mt-3 text-muted-foreground">Tell CorridorX where the money goes. We do the comparing, routing, and settlement.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: "01", t: "Describe the transfer", d: "Sender, recipient, amount, and payout type — that's it." },
            { n: "02", t: "Aggregate & rank routes", d: "We fetch quotes from every provider and score each corridor." },
            { n: "03", t: "Execute automatically", d: "Approve the best route and CorridorX settles end-to-end." },
          ].map((s) => (
            <div key={s.n} className="card-glass p-6">
              <div className="font-mono text-xs text-primary">{s.n}</div>
              <div className="mt-2 text-lg font-semibold">{s.t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Providers */}
      <section id="providers" className="container-page py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-3xl font-semibold md:text-4xl">Every rail in one place</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROVIDERS.map((p) => (
            <div key={p.id} className="card-glass flex items-center gap-4 p-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                {p.logo}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{p.name}</span>
                  <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {p.kind}
                  </span>
                </div>
                <div className="truncate text-xs text-muted-foreground">{p.network}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rialo */}
      <section id="tech" className="container-page py-16">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-semibold md:text-4xl">Built on Rialo primitives</h2>
          <p className="mt-3 text-muted-foreground">
            Edge, Workflow, Async & Reactive Transactions, Interop, Stream, IPC, REX, Read Path, and Cruise composed into a single routing fabric.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Edge", "Fetch quotes and initiate payouts across every provider API."],
            ["Workflow", "Orchestrate the multi-step lifecycle of every transfer end-to-end."],
            ["Async Transactions", "Resume automatically when providers confirm — no polling."],
            ["Reactive Transactions", "Trigger transfers on schedules or favorable FX moves."],
            ["Interop", "Move USDC across chains and settle onto the recipient's rail."],
            ["Stream", "Live FX, liquidity, gas and congestion signals feed the router."],
            ["IPC", "KYC, AML, sanctions screening and jurisdiction policy on every transfer."],
            ["REX", "Confidential execution keeps identity and bank details private."],
            ["Cruise", "Gasless UX — users never touch a native token."],
          ].map(([t, d]) => (
            <div key={t} className="card-glass p-5">
              <div className="text-sm font-semibold text-primary">Rialo {t}</div>
              <div className="mt-2 text-sm text-muted-foreground">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-24 pt-8">
        <div className="card-glass flex flex-col items-center gap-4 p-10 text-center">
          <h3 className="text-2xl font-semibold md:text-3xl">Route your first transfer in under 30 seconds.</h3>
          <p className="max-w-xl text-sm text-muted-foreground">Sign up free — full quotes, ranking, execution, tracking, and scheduling.</p>
          <button onClick={() => setConnectOpen(true)} className="btn-primary">Connect to get started</button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><Logo size={22} /></div>
          <span>© {new Date().getFullYear()} CorridorX. A universal routing layer for global money movement.</span>
        </div>
      </footer>
    </div>
  );
}
