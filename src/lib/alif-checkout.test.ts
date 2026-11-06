/* eslint-disable @typescript-eslint/no-explicit-any -- In-memory adapter for race and failure tests. */
import { beforeEach, describe, expect, it, vi } from "vitest";
const f = vi.hoisted(() => ({ rows: new Map<string, any>(), invoice: vi.fn(), get: vi.fn(), failCas: false }));
vi.mock("./pricing-server", () => ({ computeOrderTotal: async () => ({ totalUzs: 800000, lines: [{ product_id: "p", title: "Atir", quantity: 1, price_uzs: 800000, product_type: "lux_copy" }] }) }));
vi.mock("./alifpay", async (original) => ({ ...await original<typeof import("./alifpay")>(), alifRequest: (method: string, body: any) => method === "invoice" ? f.invoice(body) : f.get(body) }));
vi.mock("./alif-checkout-store", () => ({ alifStore: {
  get: async (id: string) => structuredClone(f.rows.get(id) || null),
  insert: async (row: any) => { if (f.rows.has(row.id)) return false; f.rows.set(row.id, structuredClone(row)); return true; },
  cas: async (row: any, changes: any) => {
    if (f.failCas) throw new Error("storage down");
    const existing = f.rows.get(row.id);
    if (JSON.stringify(existing) !== JSON.stringify(row)) return null;
    const updated = { ...existing, ...changes }; f.rows.set(row.id, structuredClone(updated)); return structuredClone(updated);
  },
} }));
import { startAlifCheckout, refreshAlifCheckout, authorizeAlifCheckout, recoverAlifCheckout } from "./alif-checkout";
const id = "d7c1a451-ed20-49b1-a37d-164c3f3e49e6", token = "a".repeat(48);
const input = () => ({ request_id: id, recovery_token: token, expected_total: 800000, items: [{ product_id: "7b17bf40-b3cf-4906-a9dd-46e39f751b8d", quantity: 1 }], client: { name: "Sandbox Test", phone: "998901234567", region: "Toshkent", address: "Test" } });
const invoice = (status?: string, amount = 80000000) => ({ id: "invoice-1", price: 80000000, meta: { order_id: id, mode: "sandbox" }, ...(status ? { payment: { id: "payment-1", amount, status } } : {}) });
beforeEach(() => {
  f.rows.clear(); f.failCas = false; f.invoice.mockReset(); f.get.mockReset();
  vi.stubEnv("ALIFPAY_MODE", "sandbox"); vi.stubEnv("ALIFPAY_TEST_API_TOKEN", "token"); vi.stubEnv("ALIFPAY_TEST_WEBHOOK_SECRET", "secret-key");
  f.invoice.mockResolvedValue(invoice()); f.get.mockResolvedValue(invoice("SUCCEEDED"));
});
describe("Alif durable checkout", () => {
  it("persists a draft before calling Alif, prices on server and reuses the invoice", async () => {
    f.invoice.mockImplementation(async (body) => { expect(f.rows.has(id)).toBe(true); expect(body.items[0].price).toBe(80000000); return invoice(); });
    const result = await startAlifCheckout(input());
    expect(result.checkout_url).toContain("checkout-dev.alifpay.uz");
    expect((await startAlifCheckout(input())).checkout_url).toBe(result.checkout_url);
    expect(f.invoice).toHaveBeenCalledTimes(1);
    expect(f.rows.get(id).payment_status).toBe("unpaid");
    expect(f.rows.get(id).status).toBe("cancelled");
  });
  it("rejects changed total, malformed quantity, another token and changed cart", async () => {
    await expect(startAlifCheckout({ ...input(), expected_total: 1 })).rejects.toMatchObject({ attemptNotCreated: true });
    expect(f.rows.size).toBe(0); expect(f.invoice).not.toHaveBeenCalled();
    await expect(startAlifCheckout({ ...input(), items: [{ product_id: "x", quantity: Infinity }] })).rejects.toThrow();
    await startAlifCheckout(input());
    await expect(authorizeAlifCheckout(id, "b".repeat(48))).rejects.toThrow();
    await expect(startAlifCheckout({ ...input(), client: { ...input().client, name: "other" } })).rejects.toThrow();
  });
  it("parallel starts call invoice once", async () => {
    await Promise.allSettled([startAlifCheckout(input()), startAlifCheckout(input())]);
    expect(f.invoice).toHaveBeenCalledTimes(1);
  });
  it("an uncertain API response never automatically creates another invoice", async () => {
    f.invoice.mockRejectedValue(new Error("timeout"));
    await expect(startAlifCheckout(input())).rejects.toThrow();
    await expect(startAlifCheckout(input())).rejects.toThrow();
    expect(f.invoice).toHaveBeenCalledTimes(1);
  });
  it("recovers mapping failure using a signed receipt without another invoice", async () => {
    f.failCas = true;
    let receipt = "";
    try { await startAlifCheckout(input()); } catch (e: any) { receipt = e.recoveryReceipt; }
    expect(receipt).toBeTruthy(); f.failCas = false;
    await expect(startAlifCheckout({ ...input(), recovery_receipt: receipt + "x" })).rejects.toThrow();
    await startAlifCheckout({ ...input(), recovery_receipt: receipt });
    expect(f.invoice).toHaveBeenCalledTimes(1);
    expect(f.rows.get(id).items[0].alif_checkout.invoice_id).toBe("invoice-1");
  });
  it("sandbox success stays out of revenue and fulfilment", async () => {
    await startAlifCheckout(input());
    const result = await refreshAlifCheckout(id);
    expect(result).toMatchObject({ state: "paid", sandbox: true });
    expect(f.rows.get(id)).toMatchObject({ status: "cancelled", payment_status: "unpaid" });
  });
  it("rejects mismatched invoice, amount or order binding", async () => {
    await startAlifCheckout(input());
    for (const value of [invoice("SUCCEEDED", 1), { ...invoice("SUCCEEDED"), id: "other" }, { ...invoice("SUCCEEDED"), meta: { order_id: "other", mode: "sandbox" } }]) {
      f.get.mockResolvedValue(value); await expect(refreshAlifCheckout(id)).rejects.toThrow();
    }
  });
  it("accepts the provider's empty payment object for an unpaid invoice", async () => {
    await startAlifCheckout(input());
    f.get.mockResolvedValue({ ...invoice(), payment: {} });
    expect((await refreshAlifCheckout(id)).state).toBe("pending");
  });
  it("handles refunds and ignores delayed pending/success after refund", async () => {
    await startAlifCheckout(input()); await refreshAlifCheckout(id);
    f.get.mockResolvedValue(invoice("HELD")); expect((await refreshAlifCheckout(id)).state).toBe("paid");
    f.get.mockResolvedValue(invoice("REVERTED")); expect((await refreshAlifCheckout(id)).state).toBe("refunded");
    f.get.mockResolvedValue(invoice("SUCCEEDED")); expect((await refreshAlifCheckout(id)).state).toBe("refunded");
  });
  it("does not report success when durable storage fails", async () => {
    await startAlifCheckout(input()); f.failCas = true;
    await expect(refreshAlifCheckout(id)).rejects.toThrow();
  });
  it("restores a missing mapping from the status flow using the retained signed receipt", async () => {
    f.failCas = true; let receipt = "";
    try { await startAlifCheckout(input()); } catch (e: any) { receipt = e.recoveryReceipt; }
    f.failCas = false;
    await recoverAlifCheckout(id, token, receipt);
    expect((await refreshAlifCheckout(id)).state).toBe("paid");
    expect(f.invoice).toHaveBeenCalledTimes(1);
  });
  it("production requires real confirmation, supports refunds and preserves admin cancellation", async () => {
    vi.stubEnv("ALIFPAY_MODE", "production"); vi.stubEnv("ALIFPAY_API_TOKEN", "production-token");
    vi.stubEnv("ALIFPAY_WEBHOOK_SECRET", "production-key"); vi.stubEnv("ALIFPAY_FISCAL_MODE", "external");
    const value = (state?: string) => ({ ...invoice(state), meta: { order_id: id, mode: "production" } });
    f.invoice.mockResolvedValue(value()); f.get.mockResolvedValue(value("HELD"));
    await startAlifCheckout(input());
    expect((await refreshAlifCheckout(id)).state).toBe("pending");
    expect(f.rows.get(id)).toMatchObject({ status: "pending", payment_status: "unpaid" });
    f.get.mockResolvedValue(value("SUCCEEDED")); await refreshAlifCheckout(id);
    expect(f.rows.get(id)).toMatchObject({ status: "processing", payment_status: "paid" });
    f.rows.get(id).status = "cancelled";
    await refreshAlifCheckout(id); expect(f.rows.get(id).status).toBe("cancelled");
    f.get.mockResolvedValue(value("REVERTED")); await refreshAlifCheckout(id);
    expect(f.rows.get(id)).toMatchObject({ status: "cancelled", payment_status: "cancelled" });
  });
  it("refunded delivered orders retain fulfilment for the admin accounting reversal path", async () => {
    vi.stubEnv("ALIFPAY_MODE", "production"); vi.stubEnv("ALIFPAY_API_TOKEN", "production-token");
    vi.stubEnv("ALIFPAY_WEBHOOK_SECRET", "production-key"); vi.stubEnv("ALIFPAY_FISCAL_MODE", "external");
    const value = (state?: string) => ({ ...invoice(state), meta: { order_id: id, mode: "production" } });
    f.invoice.mockResolvedValue(value()); f.get.mockResolvedValue(value("SUCCEEDED"));
    await startAlifCheckout(input()); await refreshAlifCheckout(id);
    f.rows.get(id).status = "delivered";
    f.get.mockResolvedValue(value("REVERTED")); await refreshAlifCheckout(id);
    expect(f.rows.get(id)).toMatchObject({ status: "delivered", payment_status: "cancelled" });
  });
});
