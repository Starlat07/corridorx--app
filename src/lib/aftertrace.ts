import type { Country, Quote, RecipientType } from "./corridorx.ts";

export type Priority = "cost" | "speed" | "reliability";
export type PaymentIntent = {
  from: Country;
  to: Country;
  amount: number;
  recipientAmount: number;
  maxFee: number;
  deadlineHours: number;
  recipient: RecipientType;
  priority: Priority;
};
export type RouteOutcome = {
  id: string;
  userKey: string;
  recordedAt: number;
  routeId: string;
  routeName: string;
  fromCode: string;
  toCode: string;
  senderAmount: number;
  recipient: RecipientType;
  quotedFee: number;
  actualFee: number | null;
  estimatedMinutes: number;
  actualMinutes: number | null;
  intendedRecipientAmount: number;
  actualRecipientAmount: number | null;
  status: "completed" | "failed" | "unconfirmed";
  reason: string;
  source: "user-confirmed";
};
export type RouteEvidence = {
  observations: number;
  completed: number;
  onTime: number;
  avgFeeDelta: number | null;
  avgDeliveryMinutes: number | null;
};
export type EvaluatedRoute = {
  quote: Quote;
  eligible: boolean;
  reasons: string[];
  evidence: RouteEvidence;
  score: number;
  explanation: string[];
};

export function validateIntent(i: PaymentIntent): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(i.amount) || i.amount <= 0)
    errors.push("Enter a sending amount greater than zero.");
  if (!Number.isFinite(i.recipientAmount) || i.recipientAmount <= 0)
    errors.push("Enter the minimum amount the recipient must receive.");
  if (!Number.isFinite(i.maxFee) || i.maxFee < 0) errors.push("Maximum fee must be zero or more.");
  if (!Number.isFinite(i.deadlineHours) || i.deadlineHours <= 0)
    errors.push("Choose a delivery window greater than zero.");
  if (i.from.code === i.to.code) errors.push("Choose different sending and destination countries.");
  return errors;
}

export function summarizeEvidence(
  routeId: string,
  intent: PaymentIntent,
  outcomes: RouteOutcome[],
): RouteEvidence {
  const relevant = outcomes.filter(
    (o) =>
      o.status !== "unconfirmed" &&
      o.routeId === routeId &&
      o.fromCode === intent.from.code &&
      o.toCode === intent.to.code &&
      o.recipient === intent.recipient &&
      Math.abs(o.senderAmount - intent.amount) <= Math.max(intent.amount * 0.5, 1),
  );
  const complete = relevant.filter((o) => o.status === "completed" && o.actualMinutes !== null);
  return {
    observations: relevant.length,
    completed: complete.length,
    onTime: complete.filter((o) => o.actualMinutes! <= intent.deadlineHours * 60).length,
    avgFeeDelta: relevant.some((o) => o.actualFee !== null)
      ? relevant
          .filter((o) => o.actualFee !== null)
          .reduce((s, o) => s! + (o.actualFee! - o.quotedFee), 0)! /
        relevant.filter((o) => o.actualFee !== null).length
      : null,
    avgDeliveryMinutes: complete.length
      ? complete.reduce((s, o) => s + o.actualMinutes!, 0) / complete.length
      : null,
  };
}

export function evaluateRoutes(
  intent: PaymentIntent,
  quotes: Quote[],
  outcomes: RouteOutcome[],
): { eligible: EvaluatedRoute[]; excluded: EvaluatedRoute[] } {
  const evaluated = quotes.map((quote) => {
    const reasons: string[] = [];
    if (quote.feeUSD > intent.maxFee)
      reasons.push(
        `Quoted fee ${quote.feeUSD.toFixed(2)} exceeds your ${intent.maxFee.toFixed(2)} maximum.`,
      );
    if (quote.recipientAmount < intent.recipientAmount)
      reasons.push(
        `Estimated recipient amount is below ${intent.recipientAmount.toFixed(2)} ${intent.to.currency}.`,
      );
    if (quote.etaMinutes > intent.deadlineHours * 60)
      reasons.push(
        `Estimated delivery (${quote.etaMinutes} min) misses your ${intent.deadlineHours} hour window.`,
      );
    const evidence = summarizeEvidence(quote.provider.id, intent, outcomes);
    const cost = Math.max(0, 1 - quote.totalCostUSD / Math.max(intent.amount * 0.1, 1));
    const speed = Math.max(0, 1 - quote.etaMinutes / Math.max(intent.deadlineHours * 120, 1));
    // Cold-start performance is neutral and confidence is explicitly capped by sample count.
    const observedReliability =
      evidence.completed >= 5 ? evidence.onTime / evidence.completed : quote.reliability;
    const reliability =
      evidence.completed >= 5
        ? observedReliability
        : 0.5 + (quote.reliability - 0.5) * Math.min(evidence.completed / 5, 0.4);
    const pref =
      intent.priority === "cost"
        ? cost * 0.6 + speed * 0.15 + reliability * 0.25
        : intent.priority === "speed"
          ? speed * 0.6 + cost * 0.15 + reliability * 0.25
          : reliability * 0.6 + cost * 0.2 + speed * 0.2;
    const score = pref + Math.min(evidence.completed, 10) * 0.004;
    const explanation = [
      `Quoted fee ${quote.feeUSD.toFixed(2)} is within your ${intent.maxFee.toFixed(2)} maximum.`,
      `Estimated delivery is ${quote.etaMinutes} minutes, within your ${intent.deadlineHours} hour window.`,
      `Estimated recipient amount is ${quote.recipientAmount.toFixed(2)} ${intent.to.currency}.`,
      evidence.observations < 5
        ? `Insufficient history: ${evidence.observations} relevant confirmed outcome${evidence.observations === 1 ? "" : "s"}; current quote and provider estimate guide this ranking.`
        : `${evidence.observations} relevant outcomes recorded; ${evidence.completed} confirmed completions.`,
    ];
    return { quote, eligible: reasons.length === 0, reasons, evidence, score, explanation };
  });
  return {
    eligible: evaluated.filter((x) => x.eligible).sort((a, b) => b.score - a.score),
    excluded: evaluated.filter((x) => !x.eligible),
  };
}

const key = (userKey: string) => `corridorx.aftertrace.v1.${encodeURIComponent(userKey)}`;
export function listOutcomes(userKey: string): RouteOutcome[] {
  if (typeof window === "undefined") return [];
  try {
    const data = JSON.parse(localStorage.getItem(key(userKey)) ?? "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
export function recordOutcome(outcome: RouteOutcome): { saved: boolean; outcomes: RouteOutcome[] } {
  const all = listOutcomes(outcome.userKey);
  if (all.some((o) => o.id === outcome.id)) return { saved: false, outcomes: all };
  const next = [outcome, ...all];
  localStorage.setItem(key(outcome.userKey), JSON.stringify(next));
  window.dispatchEvent(new Event("corridorx:aftertrace"));
  return { saved: true, outcomes: next };
}
