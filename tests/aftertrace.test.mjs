import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateRoutes,
  recordOutcome,
  summarizeEvidence,
  validateIntent,
} from "../src/lib/aftertrace.ts";

const us = { code: "US", name: "United States", currency: "USD", flag: "🇺🇸", rate: 1 };
const ng = { code: "NG", name: "Nigeria", currency: "NGN", flag: "🇳🇬", rate: 1580 };
const intent = {
  from: us,
  to: ng,
  amount: 500,
  recipientAmount: 700000,
  maxFee: 15,
  deadlineHours: 24,
  recipient: "bank",
  priority: "reliability",
};
const quote = (id, fee = 5, etaMinutes = 60, recipientAmount = 750000) => ({
  provider: { id, name: id, kind: "simulated" },
  sendAmount: 500,
  feeUSD: fee,
  fxRate: 1500,
  recipientAmount,
  currency: "NGN",
  etaMinutes,
  reliability: 0.9,
  totalCostUSD: fee + 2,
  score: 0.5,
  tags: [],
});

test("mandatory fee, deadline, and recipient amount requirements exclude routes", () => {
  const result = evaluateRoutes(
    intent,
    [quote("fee", 20), quote("late", 5, 1500), quote("short", 5, 60, 600000)],
    [],
  );
  assert.equal(result.eligible.length, 0);
  assert.equal(result.excluded.length, 3);
  assert.match(result.excluded[0].reasons[0], /maximum/);
});

test("ranking follows declared preference only among eligible routes", () => {
  const costIntent = { ...intent, priority: "cost" };
  const result = evaluateRoutes(costIntent, [quote("cheap", 2, 120), quote("fast", 8, 10)], []);
  assert.equal(result.eligible[0].quote.provider.id, "cheap");
  assert.equal(
    result.eligible.every((r) => r.eligible),
    true,
  );
});

test("cold start evidence is explicit and provider estimate remains cautious", () => {
  const result = evaluateRoutes(intent, [quote("new")], []);
  assert.equal(result.eligible[0].evidence.observations, 0);
  assert.match(result.eligible[0].explanation.at(-1), /Insufficient history/);
});

test("unconfirmed and duplicate outcomes do not inflate evidence", () => {
  const base = {
    id: "same-id",
    userKey: "test",
    recordedAt: 1,
    routeId: "route",
    routeName: "route",
    fromCode: "US",
    toCode: "NG",
    senderAmount: 500,
    recipient: "bank",
    quotedFee: 5,
    actualFee: 6,
    estimatedMinutes: 60,
    actualMinutes: 60,
    intendedRecipientAmount: 700000,
    actualRecipientAmount: 740000,
    status: "completed",
    reason: "",
    source: "user-confirmed",
  };
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, v),
  };
  globalThis.window = { dispatchEvent() {} };
  try {
    assert.equal(recordOutcome(base).saved, true);
    assert.equal(recordOutcome(base).saved, false);
    const unconfirmed = { ...base, id: "pending", status: "unconfirmed", actualMinutes: null };
    const pendingOnly = summarizeEvidence("route", intent, [unconfirmed]);
    assert.equal(pendingOnly.observations, 0);
    const confirmed = summarizeEvidence("route", intent, [base]);
    assert.equal(confirmed.observations, 1);
    assert.equal(confirmed.completed, 1);
  } finally {
    delete globalThis.window;
    delete globalThis.localStorage;
  }
});

test("intent validation reports invalid amounts and same-country routes", () => {
  assert.equal(validateIntent({ ...intent, amount: 0, to: us }).length, 2);
});
