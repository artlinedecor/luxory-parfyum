import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { alifConfig, alifRequest, toTiyin, verifyAlifSignature, alifPaymentState } from "./alifpay";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("Alif protocol", () => {
  it("requires explicit fiscal fields for automatic Alif receipts", () => {
    vi.stubEnv("ALIFPAY_MODE", "production"); vi.stubEnv("ALIFPAY_API_TOKEN", "prod"); vi.stubEnv("ALIFPAY_WEBHOOK_SECRET", "key");
    vi.stubEnv("ALIFPAY_FISCAL_MODE", "alif"); vi.stubEnv("ALIFPAY_SPIC", "");
    expect(() => alifConfig()).toThrow();
    vi.stubEnv("ALIFPAY_SPIC", "03303001001000000"); vi.stubEnv("ALIFPAY_VAT_PERCENT", "");
    expect(() => alifConfig()).toThrow();
    vi.stubEnv("ALIFPAY_VAT_PERCENT", "12");
    expect(alifConfig()).toMatchObject({ fiscal: { spic: "03303001001000000", vat_percent: 12 } });
    vi.stubEnv("ALIFPAY_VAT_PERCENT", "12.5"); expect(() => alifConfig()).toThrow();
  });
  it("defaults off and separates sandbox credentials from production", () => {
    vi.stubEnv("ALIFPAY_MODE", "");
    expect(() => alifConfig()).toThrow();
    vi.stubEnv("ALIFPAY_MODE", "sandbox");
    vi.stubEnv("ALIFPAY_TEST_API_TOKEN", "test-token"); vi.stubEnv("ALIFPAY_TEST_WEBHOOK_SECRET", "test-key");
    expect(alifConfig()).toMatchObject({ mode: "sandbox", api: "https://api-dev.alifpay.uz/v2", token: "test-token" });
    vi.stubEnv("ALIFPAY_MODE", "production");
    expect(() => alifConfig()).toThrow();
  });
  it("uses safe integer tiyin", () => {
    expect(toTiyin(800000)).toBe(80000000);
    for (const n of [0, -1, Infinity, 0.001, Number.MAX_SAFE_INTEGER]) expect(() => toTiyin(n)).toThrow();
  });
  it("validates the raw body signature and rejects altered bytes", () => {
    const body = Buffer.from('{ "status": "SUCCEEDED" }');
    const sig = createHmac("sha256", "key").update(body).digest("base64");
    expect(verifyAlifSignature(body, sig, "key")).toBe(true);
    expect(verifyAlifSignature(Buffer.from('{"status":"SUCCEEDED"}'), sig, "key")).toBe(false);
    expect(verifyAlifSignature(body, sig, "wrong")).toBe(false);
    expect(verifyAlifSignature(body, "!", "key")).toBe(false);
    expect(verifyAlifSignature(body, sig, "")).toBe(false);
  });
  it("treats HTTP 200 business error as failure without exposing provider text", async () => {
    vi.stubEnv("ALIFPAY_MODE", "sandbox"); vi.stubEnv("ALIFPAY_TEST_API_TOKEN", "token"); vi.stubEnv("ALIFPAY_TEST_WEBHOOK_SECRET", "key");
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 1005, message: "private" } })));
    vi.stubGlobal("fetch", fetcher);
    await expect(alifRequest("getInvoice", { id: "x" }, alifConfig())).rejects.toThrow("1005");
    expect(fetcher.mock.calls[0][1]).toMatchObject({ redirect: "error", cache: "no-store", headers: { Token: "token" } });
  });
  it("only SUCCEEDED is paid; pending and HELD are not", () => {
    expect(alifPaymentState("SUCCEEDED")).toBe("paid");
    expect(alifPaymentState("REVERTED")).toBe("refunded");
    for (const status of [undefined, "HELD", "PENDING", "OTP_REQUIRED", "PENDING_REVERSAL", "UNKNOWN"]) expect(alifPaymentState(status)).toBe("pending");
  });
});
