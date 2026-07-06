// PayHero API client (https://backend.payhero.co.ke/api/v2/)
// Field names verified against PayHero's official PHP SDK:
// https://github.com/PAY-HERO-KENYA/payhero-php-package/blob/main/ph-class.php

export interface PayHeroEnv {
  PAYHERO_AUTH_TOKEN: string;
  PAYHERO_CHANNEL_ID: string;
}

export type JsonRecord = Record<string, unknown>;

const BASE_URL = "https://backend.payhero.co.ke/api/v2/";

// Safaricom's network code, used by PayHero for M-Pesa mobile payouts.
const SAFARICOM_NETWORK_CODE = "63902";

function authHeader(env: PayHeroEnv): string {
  const token = env.PAYHERO_AUTH_TOKEN || "";
  return token.startsWith("Basic ") ? token : `Basic ${token}`;
}

// Returns the first key present on obj whose value is a string/number, as a string.
function pick(obj: JsonRecord | undefined, ...keys: string[]): string | undefined {
  if (!obj) return undefined;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

async function request(env: PayHeroEnv, path: string, method: "GET" | "POST", body?: unknown) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: authHeader(env),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let raw: JsonRecord = {};
  try {
    raw = text ? JSON.parse(text) : {};
  } catch {
    raw = { rawText: text };
  }

  return { ok: response.ok, status: response.status, raw };
}

export function normalizePhone(phone: string): string {
  const digits = (phone || "").replace(/[^0-9]/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

export interface StkPushParams {
  amount: number;
  phoneNumber: string;
  externalReference: string;
  callbackUrl: string;
}

export interface StkPushResult {
  success: boolean;
  reference?: string;
  status?: string;
  raw: JsonRecord;
}

export async function initiateStkPush(env: PayHeroEnv, params: StkPushParams): Promise<StkPushResult> {
  const { ok, raw } = await request(env, "payments", "POST", {
    amount: Math.round(params.amount),
    phone_number: normalizePhone(params.phoneNumber),
    channel_id: Number(env.PAYHERO_CHANNEL_ID),
    provider: "m-pesa",
    external_reference: params.externalReference,
    callback_url: params.callbackUrl,
  });

  return {
    success: ok,
    reference: pick(raw, "reference", "CheckoutRequestID", "checkout_request_id"),
    status: pick(raw, "status"),
    raw,
  };
}

export async function checkTransactionStatus(env: PayHeroEnv, reference: string) {
  const { ok, raw } = await request(env, `transaction-status?reference=${encodeURIComponent(reference)}`, "GET");
  return { success: ok, raw };
}

export interface WithdrawParams {
  amount: number;
  phoneNumber: string;
  externalReference: string;
  callbackUrl: string;
}

export interface WithdrawResult {
  success: boolean;
  reference?: string;
  raw: JsonRecord;
}

export async function initiateWithdrawal(env: PayHeroEnv, params: WithdrawParams): Promise<WithdrawResult> {
  const { ok, raw } = await request(env, "withdraw", "POST", {
    amount: Math.round(params.amount),
    phone_number: normalizePhone(params.phoneNumber),
    network_code: SAFARICOM_NETWORK_CODE,
    channel: "mobile",
    external_reference: params.externalReference,
    callback_url: params.callbackUrl,
  });

  return {
    success: ok,
    reference: pick(raw, "reference", "conversation_id", "checkout_request_id"),
    raw,
  };
}

// PayHero's callback payload shape isn't publicly documented in detail, so this
// tries several known/likely field paths and always degrades to "unknown"
// rather than throwing. Callers persist the raw payload separately regardless.
export interface ParsedCallback {
  externalReference?: string;
  status: "success" | "failed" | "unknown";
  receiptNumber?: string;
  amount?: number;
}

export function parseCallbackPayload(body: JsonRecord): ParsedCallback {
  const response = (body?.response as JsonRecord) ?? body;

  const externalReference = pick(response, "external_reference", "ExternalReference", "merchant_reference")
    ?? pick(body, "external_reference");

  const rawStatus = (pick(response, "status", "Status", "ResultDesc") ?? "").toLowerCase();

  let status: ParsedCallback["status"] = "unknown";
  if (response?.ResultCode === 0 || rawStatus.includes("success") || rawStatus === "completed") {
    status = "success";
  } else if (rawStatus.includes("fail") || rawStatus.includes("cancel") || rawStatus.includes("error")) {
    status = "failed";
  }

  const receiptNumber = pick(response, "mpesa_receipt_number", "MpesaReceiptNumber", "receipt_number");

  const amountStr = pick(response, "amount", "Amount");
  const amount = amountStr !== undefined ? Number(amountStr) : NaN;

  return {
    externalReference,
    status,
    receiptNumber,
    amount: Number.isFinite(amount) ? amount : undefined,
  };
}
