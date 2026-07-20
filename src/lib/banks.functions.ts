import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Countries served by Flutterwave for bank lists.
const FLW_COUNTRIES = ["GH", "KE", "ZA", "UG", "TZ"] as const;
// Paystack handles Nigeria (and its country=ghana list) — we use it for NG primary.
const PAYSTACK_COUNTRIES: Record<string, string> = { NG: "nigeria" };

type Bank = { code: string; name: string };

const bankCache = new Map<string, { at: number; banks: Bank[] }>();
const nameCache = new Map<string, { at: number; name: string | null; reason?: string }>();
const TTL = 24 * 60 * 60 * 1000;

async function fetchPaystackBanks(countryQuery: string): Promise<Bank[] | null> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return null;
  const res = await fetch(`https://api.paystack.co/bank?country=${countryQuery}&perPage=100`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ code: string; name: string }> };
  return (json.data ?? [])
    .map((b) => ({ code: b.code, name: b.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchFlutterwaveBanks(country: string): Promise<Bank[] | null> {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) return null;
  const res = await fetch(`https://api.flutterwave.com/v3/banks/${country}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ code: string; name: string }> };
  return (json.data ?? [])
    .map((b) => ({ code: b.code, name: b.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const listBanks = createServerFn({ method: "POST" })
  .inputValidator((d: { country: string }) => z.object({ country: z.string().length(2) }).parse(d))
  .handler(async ({ data }) => {
    const country = data.country.toUpperCase();
    const cached = bankCache.get(country);
    if (cached && Date.now() - cached.at < TTL) {
      return { supported: true, banks: cached.banks };
    }

    let banks: Bank[] | null = null;
    if (PAYSTACK_COUNTRIES[country]) {
      banks = await fetchPaystackBanks(PAYSTACK_COUNTRIES[country]);
    } else if ((FLW_COUNTRIES as readonly string[]).includes(country)) {
      banks = await fetchFlutterwaveBanks(country);
    } else {
      return { supported: false, banks: [] as Bank[] };
    }

    if (!banks || !banks.length) {
      return { supported: false, banks: [] as Bank[], error: "Bank list temporarily unavailable." };
    }
    bankCache.set(country, { at: Date.now(), banks });
    return { supported: true, banks };
  });

async function resolveWithPaystack(bankCode: string, accountNumber: string) {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return { ok: false as const, reason: "Paystack not configured." };
  const url = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  const json = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: { account_name?: string; account_number?: string };
  };
  if (!res.ok || !json.status || !json.data?.account_name) {
    return { ok: false as const, reason: json.message || "Account not found at this bank." };
  }
  return { ok: true as const, name: json.data.account_name };
}

async function resolveWithFlutterwave(bankCode: string, accountNumber: string) {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) return { ok: false as const, reason: "Flutterwave not configured." };
  const res = await fetch("https://api.flutterwave.com/v3/accounts/resolve", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ account_number: accountNumber, account_bank: bankCode }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    status?: string;
    message?: string;
    data?: { account_name?: string };
  };
  if (!res.ok || json.status !== "success" || !json.data?.account_name) {
    return { ok: false as const, reason: json.message || "Account not found at this bank." };
  }
  return { ok: true as const, name: json.data.account_name };
}

export const resolveBankAccount = createServerFn({ method: "POST" })
  .inputValidator((d: { country: string; bankCode: string; accountNumber: string }) =>
    z
      .object({
        country: z.string().length(2),
        bankCode: z.string().min(1).max(20),
        accountNumber: z.string().min(6).max(20),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const country = data.country.toUpperCase();
    if (country !== "NG") {
      return {
        resolved: false as const,
        reason: "Automatic name lookup is only available for Nigeria right now. Enter the recipient's name manually.",
      };
    }
    const acct = data.accountNumber.replace(/\D/g, "");
    if (acct.length !== 10) {
      return { resolved: false as const, reason: "Nigerian bank account numbers must be exactly 10 digits." };
    }
    const cacheKey = `${country}:${data.bankCode}:${acct}`;
    const cached = nameCache.get(cacheKey);
    if (cached && Date.now() - cached.at < TTL) {
      return cached.name
        ? { resolved: true as const, name: cached.name }
        : { resolved: false as const, reason: cached.reason ?? "Account not found at this bank." };
    }

    // Primary: Paystack. Fallback: Flutterwave (only useful if codes happen to match).
    let result = await resolveWithPaystack(data.bankCode, acct);
    if (!result.ok) {
      const fallback = await resolveWithFlutterwave(data.bankCode, acct);
      if (fallback.ok) result = fallback;
    }

    if (result.ok) {
      nameCache.set(cacheKey, { at: Date.now(), name: result.name });
      return { resolved: true as const, name: result.name };
    }
    nameCache.set(cacheKey, { at: Date.now(), name: null, reason: result.reason });
    return { resolved: false as const, reason: result.reason };
  });
