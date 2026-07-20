// CorridorX core logic: providers, quotes, routing engine, storage.
export type Country = {
  code: string;
  name: string;
  currency: string;
  flag: string;
  rate: number; // units of local currency per 1 USD
};

export const COUNTRIES: Country[] = [
  { code: "US", name: "United States", currency: "USD", flag: "🇺🇸", rate: 1 },
  { code: "NG", name: "Nigeria", currency: "NGN", flag: "🇳🇬", rate: 1580 },
  { code: "GB", name: "United Kingdom", currency: "GBP", flag: "🇬🇧", rate: 0.79 },
  { code: "IN", name: "India", currency: "INR", flag: "🇮🇳", rate: 83.4 },
  { code: "KE", name: "Kenya", currency: "KES", flag: "🇰🇪", rate: 129 },
  { code: "PH", name: "Philippines", currency: "PHP", flag: "🇵🇭", rate: 56.2 },
  { code: "MX", name: "Mexico", currency: "MXN", flag: "🇲🇽", rate: 17.3 },
  { code: "EU", name: "Eurozone", currency: "EUR", flag: "🇪🇺", rate: 0.92 },
  { code: "GH", name: "Ghana", currency: "GHS", flag: "🇬🇭", rate: 15.3 },
  { code: "ZA", name: "South Africa", currency: "ZAR", flag: "🇿🇦", rate: 18.6 },
];

// Per-country payout method catalogue for dynamic recipient forms.
export const COUNTRY_BANKS: Record<string, string[]> = {
  US: ["Chase", "Bank of America", "Wells Fargo", "Citibank", "Capital One"],
  NG: ["GTBank", "Access Bank", "Zenith Bank", "UBA", "First Bank", "Kuda"],
  GB: ["Barclays", "HSBC UK", "Lloyds", "NatWest", "Monzo", "Starling"],
  IN: ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra"],
  KE: ["Equity Bank", "KCB", "Co-operative Bank", "NCBA", "Absa Kenya"],
  PH: ["BDO", "BPI", "Metrobank", "UnionBank", "Landbank"],
  MX: ["BBVA México", "Banorte", "Santander", "Banamex", "HSBC México"],
  EU: ["Deutsche Bank", "BNP Paribas", "ING", "Santander", "Revolut"],
  GH: ["GCB Bank", "Ecobank Ghana", "Absa Ghana", "Stanbic", "Fidelity"],
  ZA: ["Standard Bank", "FNB", "ABSA", "Nedbank", "Capitec"],
};

export const COUNTRY_MOBILE_MONEY: Record<string, string[]> = {
  NG: ["OPay", "PalmPay", "MoniePoint"],
  KE: ["M-Pesa", "Airtel Money", "T-Kash"],
  GH: ["MTN MoMo", "AirtelTigo Money", "Vodafone Cash"],
  PH: ["GCash", "PayMaya", "Coins.ph"],
  IN: ["Paytm", "PhonePe", "Google Pay"],
  ZA: ["MTN MoMo", "Vodacom M-Pesa"],
  MX: ["Mercado Pago", "Oxxo Pay"],
  US: ["Venmo", "Cash App", "Zelle"],
  GB: ["Revolut Pay", "Monzo"],
  EU: ["Revolut Pay", "Wise"],
};

export const CRYPTO_NETWORKS = [
  { id: "usdc-base", label: "USDC · Base", hint: "0x… (Ethereum-format address)" },
  { id: "usdc-sol", label: "USDC · Solana", hint: "Solana wallet address" },
  { id: "usdt-tron", label: "USDT · Tron (TRC20)", hint: "T… address" },
  { id: "btc", label: "BTC · Bitcoin", hint: "bc1… or 1… address" },
];

// Validators for recipient details per payout type.
export function validateBankAccount(v: string): string | null {
  const digits = v.replace(/[^\d]/g, "");
  if (!digits) return "Account number required";
  if (digits.length < 6 || digits.length > 20) return "Account number must be 6–20 digits";
  return null;
}

export function validateMobilePhone(v: string): string | null {
  const cleaned = v.replace(/[\s\-()]/g, "");
  if (!cleaned) return "Phone number required";
  if (!/^\+?\d{8,15}$/.test(cleaned)) return "Enter a valid international phone (e.g. +2348012345678)";
  return null;
}

export function validateCryptoAddress(network: string, addr: string): string | null {
  const a = addr.trim();
  if (!a) return "Wallet address required";
  switch (network) {
    case "usdc-base":
      return /^0x[a-fA-F0-9]{40}$/.test(a) ? null : "Invalid EVM address — must start with 0x and be 42 chars";
    case "usdc-sol":
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a) ? null : "Invalid Solana address (base58, 32–44 chars)";
    case "usdt-tron":
      return /^T[a-zA-Z0-9]{33}$/.test(a) ? null : "Invalid Tron address — must start with T and be 34 chars";
    case "btc":
      return /^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(a) ? null : "Invalid Bitcoin address";
    default:
      return null;
  }
}

export type RecipientType = "bank" | "mobile" | "crypto";

export type Provider = {
  id: string;
  name: string;
  kind: "real" | "simulated";
  logo: string; // emoji or short text badge
  color: string;
  feePct: number;       // percentage fee
  feeFlat: number;      // flat USD fee
  spreadPct: number;    // FX markup
  etaMinutes: number;
  reliability: number;  // 0-1
  supports: RecipientType[];
  network: string;
};

export const PROVIDERS: Provider[] = [
  {
    id: "circle-rialo",
    name: "Circle + Rialo",
    kind: "real",
    logo: "◎",
    color: "#14E0B4",
    feePct: 0.001,
    feeFlat: 1.5,
    spreadPct: 0.001,
    etaMinutes: 2,
    reliability: 0.99,
    supports: ["bank", "mobile", "crypto"],
    network: "USDC on Base via Rialo Interop",
  },
  {
    id: "flutterwave",
    name: "Flutterwave",
    kind: "real",
    logo: "F",
    color: "#F5A623",
    feePct: 0.008,
    feeFlat: 3.0,
    spreadPct: 0.004,
    etaMinutes: 10,
    reliability: 0.97,
    supports: ["bank", "mobile"],
    network: "Flutterwave Sandbox",
  },
  {
    id: "wise",
    name: "Wise",
    kind: "simulated",
    logo: "W",
    color: "#9FE870",
    feePct: 0.0055,
    feeFlat: 4.5,
    spreadPct: 0.0035,
    etaMinutes: 60,
    reliability: 0.98,
    supports: ["bank"],
    network: "SWIFT + local rails",
  },
  {
    id: "bank-wire",
    name: "Bank Wire",
    kind: "simulated",
    logo: "🏦",
    color: "#7AA5FF",
    feePct: 0.015,
    feeFlat: 25,
    spreadPct: 0.02,
    etaMinutes: 60 * 24 * 2,
    reliability: 0.94,
    supports: ["bank"],
    network: "SWIFT correspondent",
  },
  {
    id: "remitly",
    name: "RemitClassic",
    kind: "simulated",
    logo: "R",
    color: "#C084FC",
    feePct: 0.012,
    feeFlat: 3.99,
    spreadPct: 0.015,
    etaMinutes: 60 * 6,
    reliability: 0.95,
    supports: ["bank", "mobile"],
    network: "Aggregated cash-out network",
  },
];

export type Quote = {
  provider: Provider;
  sendAmount: number;
  feeUSD: number;
  fxRate: number;
  recipientAmount: number;
  currency: string;
  etaMinutes: number;
  reliability: number;
  totalCostUSD: number;
  score: number;
  tags: string[];
};

export function getQuotes(
  from: Country,
  to: Country,
  amount: number,
  recipient: RecipientType
): Quote[] {
  const baseFx = to.rate / from.rate;
  return PROVIDERS.filter((p) => p.supports.includes(recipient)).map((p) => {
    const feeUSD = amount * p.feePct + p.feeFlat;
    const fxRate = baseFx * (1 - p.spreadPct);
    const recipientAmount = (amount - feeUSD) * fxRate;
    const totalCostUSD = feeUSD + amount * p.spreadPct;
    // scoring: lower cost + faster + more reliable = higher score
    const costScore = 1 - Math.min(totalCostUSD / amount, 0.1) / 0.1;
    const speedScore = 1 - Math.min(p.etaMinutes / (60 * 48), 1);
    const relScore = p.reliability;
    const score = costScore * 0.5 + speedScore * 0.3 + relScore * 0.2;
    return {
      provider: p,
      sendAmount: amount,
      feeUSD,
      fxRate,
      recipientAmount,
      currency: to.currency,
      etaMinutes: p.etaMinutes,
      reliability: p.reliability,
      totalCostUSD,
      score,
      tags: [],
    };
  });
}

export function rankQuotes(quotes: Quote[]): Quote[] {
  if (!quotes.length) return [];
  const sorted = [...quotes];
  const cheapest = [...sorted].sort((a, b) => a.totalCostUSD - b.totalCostUSD)[0];
  const fastest = [...sorted].sort((a, b) => a.etaMinutes - b.etaMinutes)[0];
  const mostReliable = [...sorted].sort((a, b) => b.reliability - a.reliability)[0];
  const best = [...sorted].sort((a, b) => b.score - a.score)[0];
  for (const q of sorted) {
    if (q.provider.id === cheapest.provider.id) q.tags.push("Cheapest");
    if (q.provider.id === fastest.provider.id) q.tags.push("Fastest");
    if (q.provider.id === mostReliable.provider.id) q.tags.push("Most Reliable");
    if (q.provider.id === best.provider.id) q.tags.push("Best Overall");
  }
  return sorted.sort((a, b) => b.score - a.score);
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "NGN" || currency === "INR" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatEta(mins: number): string {
  if (mins < 60) return `${mins} min`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} hr`;
  return `${Math.round(mins / (60 * 24))} days`;
}

// ---- Transfer storage (localStorage) ----
export type TransferStatus =
  | "initiated"
  | "processing"
  | "awaiting"
  | "completed"
  | "failed";

export type Transfer = {
  id: string;
  createdAt: number;
  from: Country;
  to: Country;
  amount: number;
  recipient: RecipientType;
  recipientName: string;
  recipientDetails: string;
  quote: Quote;
  status: TransferStatus;
  timeline: { at: number; status: TransferStatus; note: string }[];
};

export type Scheduled = {
  id: string;
  createdAt: number;
  from: Country;
  to: Country;
  amount: number;
  recipient: RecipientType;
  recipientName: string;
  cadence: "weekly" | "monthly" | "on-rate";
  nextRun: number;
  active: boolean;
};

const T_KEY = "corridorx.transfers.v1";
const S_KEY = "corridorx.scheduled.v1";

function safeRead<T>(k: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(k) ?? "[]") as T[];
  } catch {
    return [];
  }
}

export function listTransfers(): Transfer[] {
  return safeRead<Transfer>(T_KEY).sort((a, b) => b.createdAt - a.createdAt);
}
export function saveTransfer(t: Transfer) {
  const all = safeRead<Transfer>(T_KEY);
  const idx = all.findIndex((x) => x.id === t.id);
  if (idx >= 0) all[idx] = t;
  else all.push(t);
  localStorage.setItem(T_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("corridorx:update"));
}

export function listScheduled(): Scheduled[] {
  return safeRead<Scheduled>(S_KEY).sort((a, b) => a.nextRun - b.nextRun);
}
export function saveScheduled(s: Scheduled) {
  const all = safeRead<Scheduled>(S_KEY);
  const idx = all.findIndex((x) => x.id === s.id);
  if (idx >= 0) all[idx] = s;
  else all.push(s);
  localStorage.setItem(S_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("corridorx:update"));
}
export function removeScheduled(id: string) {
  const all = safeRead<Scheduled>(S_KEY).filter((x) => x.id !== id);
  localStorage.setItem(S_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("corridorx:update"));
}

export function newId(): string {
  return "tx_" + Math.random().toString(36).slice(2, 10);
}

// Simulate progress of a transfer through statuses.
export function simulateTransfer(id: string) {
  const steps: { s: TransferStatus; note: string; delay: number }[] = [
    { s: "processing", note: "Rialo Workflow routing payment", delay: 1200 },
    { s: "awaiting", note: "Awaiting provider confirmation", delay: 1600 },
    { s: "completed", note: "Funds delivered to recipient", delay: 1800 },
  ];
  let cursor = 0;
  const tick = () => {
    const all = listTransfers();
    const t = all.find((x) => x.id === id);
    if (!t || t.status === "completed" || t.status === "failed") return;
    const step = steps[cursor++];
    if (!step) return;
    t.status = step.s;
    t.timeline.push({ at: Date.now(), status: step.s, note: step.note });
    saveTransfer(t);
    if (cursor < steps.length) setTimeout(tick, step.delay);
  };
  setTimeout(tick, 800);
}

// AI recommendation text generator (deterministic heuristic).
export function aiRecommendation(quotes: Quote[]): string {
  if (!quotes.length) return "";
  const best = quotes[0];
  const cheapest = [...quotes].sort((a, b) => a.totalCostUSD - b.totalCostUSD)[0];
  const fastest = [...quotes].sort((a, b) => a.etaMinutes - b.etaMinutes)[0];
  if (best.provider.id === cheapest.provider.id && best.provider.id === fastest.provider.id) {
    return `${best.provider.name} is currently the cheapest, fastest, and most reliable route — an obvious pick.`;
  }
  return `${best.provider.name} offers the best overall balance. If cost is critical, ${cheapest.provider.name} saves you ${formatCurrency(best.totalCostUSD - cheapest.totalCostUSD, "USD")}; for speed, ${fastest.provider.name} arrives in ${formatEta(fastest.etaMinutes)}.`;
}
