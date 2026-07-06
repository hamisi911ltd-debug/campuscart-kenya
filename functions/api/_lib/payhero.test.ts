import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  normalizePhone,
  initiateStkPush,
  checkTransactionStatus,
  initiateWithdrawal,
  parseCallbackPayload,
  type PayHeroEnv,
} from "./payhero";

const env: PayHeroEnv = {
  PAYHERO_AUTH_TOKEN: "Basic dGVzdDp0ZXN0",
  PAYHERO_CHANNEL_ID: "9888",
};

function mockFetchOnce(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    text: async () => JSON.stringify(body),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalizePhone", () => {
  it("passes through a 254-prefixed number", () => {
    expect(normalizePhone("254712345678")).toBe("254712345678");
  });

  it("converts a leading-0 number", () => {
    expect(normalizePhone("0712345678")).toBe("254712345678");
  });

  it("converts a bare 9-digit number", () => {
    expect(normalizePhone("712345678")).toBe("254712345678");
  });

  it("strips non-digit characters", () => {
    expect(normalizePhone("+254 712 345 678")).toBe("254712345678");
  });
});

describe("initiateStkPush", () => {
  it("posts the exact fields PayHero's API expects", async () => {
    const fetchMock = mockFetchOnce({ reference: "abc-123", status: "QUEUED" });

    const result = await initiateStkPush(env, {
      amount: 100.6,
      phoneNumber: "0712345678",
      externalReference: "order-1",
      callbackUrl: "https://example.com/api/payhero/callback",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://backend.payhero.co.ke/api/v2/payments");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe(env.PAYHERO_AUTH_TOKEN);
    expect(JSON.parse(init.body)).toEqual({
      amount: 101, // rounded
      phone_number: "254712345678",
      channel_id: 9888,
      provider: "m-pesa",
      external_reference: "order-1",
      callback_url: "https://example.com/api/payhero/callback",
    });

    expect(result.success).toBe(true);
    expect(result.reference).toBe("abc-123");
  });

  it("reports failure when PayHero responds non-ok", async () => {
    mockFetchOnce({ error: "invalid channel" }, false);
    const result = await initiateStkPush(env, {
      amount: 50,
      phoneNumber: "0712345678",
      externalReference: "order-2",
      callbackUrl: "https://example.com/cb",
    });
    expect(result.success).toBe(false);
  });
});

describe("checkTransactionStatus", () => {
  it("GETs the transaction-status endpoint with an encoded reference", async () => {
    const fetchMock = mockFetchOnce({ status: "SUCCESS" });
    await checkTransactionStatus(env, "abc/123 xyz");

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe("https://backend.payhero.co.ke/api/v2/transaction-status?reference=abc%2F123%20xyz");
  });
});

describe("initiateWithdrawal", () => {
  it("posts the withdraw-to-mobile fields (no channel_id/provider)", async () => {
    const fetchMock = mockFetchOnce({ reference: "wd-1" });

    await initiateWithdrawal(env, {
      amount: 500,
      phoneNumber: "0798765432",
      externalReference: "withdrawal-1",
      callbackUrl: "https://example.com/api/payhero/callback",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://backend.payhero.co.ke/api/v2/withdraw");
    expect(JSON.parse(init.body)).toEqual({
      amount: 500,
      phone_number: "254798765432",
      network_code: "63902",
      channel: "mobile",
      external_reference: "withdrawal-1",
      callback_url: "https://example.com/api/payhero/callback",
    });
  });
});

describe("parseCallbackPayload", () => {
  it("detects success from a nested response object", () => {
    const parsed = parseCallbackPayload({
      response: {
        external_reference: "order-1",
        status: "Success",
        mpesa_receipt_number: "ABC123",
        amount: 100,
      },
    });
    expect(parsed).toEqual({
      externalReference: "order-1",
      status: "success",
      receiptNumber: "ABC123",
      amount: 100,
    });
  });

  it("detects failure from a cancelled/failed status string", () => {
    const parsed = parseCallbackPayload({ external_reference: "order-2", status: "Cancelled by user" });
    expect(parsed.status).toBe("failed");
  });

  it("falls back to unknown for an unrecognized shape", () => {
    const parsed = parseCallbackPayload({ foo: "bar" });
    expect(parsed.status).toBe("unknown");
    expect(parsed.externalReference).toBeUndefined();
  });

  it("treats Safaricom ResultCode 0 as success", () => {
    const parsed = parseCallbackPayload({ external_reference: "order-3", ResultCode: 0, ResultDesc: "The service request is processed successfully." });
    expect(parsed.status).toBe("success");
  });
});
