/* eslint-disable @typescript-eslint/no-explicit-any -- Heterogeneous JSON records in the test-only storage adapter. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({ rows: new Map<string, any>(), links: new Map<number, any>(), events: [] as string[],
  create: vi.fn(), calculate: vi.fn(), buyer: vi.fn(), status: vi.fn(), link: vi.fn(), patch: vi.fn(), writeBank: vi.fn(), activate: vi.fn(), notify: vi.fn() }));
vi.mock("./uzumnasiya", () => ({
  checkBuyerStatus: f.buyer, calculateTariffs: f.calculate, createOrder: f.create, checkContractStatus: f.status,
  productIdToInt: () => 42, UZUM_DEFAULT_CATEGORY: 1, UZUM_UNIT_PIECE: 1,
}));
vi.mock("./pricing-server", () => ({ computeOrderTotal: async () => ({ totalUzs: 800000,
  lines: [{ product_id: "p1", title: "Atir", quantity: 1, price_uzs: 800000, product_type: "lux_copy" }] }) }));
vi.mock("./uzum-checkout-store", () => ({ checkoutStore: {
  get: async (id: string) => structuredClone(f.rows.get(id) || null),
  insert: async (row: any) => { if (f.rows.has(row.id)) return false; f.events.push("persist"); f.rows.set(row.id, structuredClone(row)); return true; },
  patch: f.patch,
  writeBank: f.writeBank,
  activate: f.activate,
  complete: async (order: any, fields: any) => { const row = f.rows.get(order.id); if (row.items[0].uzum_checkout?.signed || row.status === "cancelled" || row.status !== order.status || row.payment_status !== order.payment_status) return null; Object.assign(row, structuredClone(fields)); return row; },
  touchChecked: async (order: any) => { order.items[0].uzum_checkout.last_checked_at = Date.now(); f.rows.set(order.id, structuredClone(order)); return order; },
  link: f.link,
  contractForOrder: async (id: string) => [...f.links.values()].find(r => r.order_row_id === id) || null,
  byContract: async (id: number) => [...f.rows.values()].find(r => r.items[0].uzum_checkout?.contract_id === id) || f.rows.get(f.links.get(id)?.order_row_id) || null,
  byExternal: async (id: number) => [...f.rows.values()].find(r => r.items[0].uzum_checkout?.ext_order_id === id) || null,
} }));
vi.mock("./uzum-checkout-notify", () => ({ notifyUzumCheckout: f.notify }));

import { startCheckout, finishCheckout, processUzumWebhook, authorizeCheckout } from "./uzum-checkout-server";
const input = {
  request_id: "c01ea122-96ab-4fcb-b378-2cbb12e70101", recovery_token: "c01ea122-96ab-4fcb-b378-2cbb12e70102",
  user_id: 123, period: "3 Default", expected_total: 800000,
  client: { name: "Test", phone: "998901234567", address: "Test address", region: "Toshkent" },
  products: [{ product_id: "p1", amount: 1 }],
};
beforeEach(() => {
  vi.clearAllMocks(); f.rows.clear(); f.links.clear(); f.events.length = 0;
  f.buyer.mockResolvedValue({ data: { status: 4, buyer_id: 123, has_limit: true } });
  f.calculate.mockResolvedValue({ data: [{ tariff: "3 Default", is_available: true, total: 800000, month: 266667 }] });
  f.create.mockImplementation(async () => { f.events.push("bank-create"); return { data: {
    paymart_client: { contract_id: 777, order: 888, price_month: "266667", total: "800000" },
    webview_path: "https://auth.uzumnasiya.uz/sign", client_act_pdf: "https://example.test/act.pdf",
  } }; });
  f.status.mockResolvedValue({ data: { contract_id: 777, contract_status: 2, is_signed: true } });
  vi.stubEnv("INTERNAL_API_SECRET", "test-recovery-secret-never-used-in-production");
  f.patch.mockImplementation(async (id: string, fields: any) => { Object.assign(f.rows.get(id), structuredClone(fields)); return f.rows.get(id); });
  f.writeBank.mockImplementation(async (order: any, meta: any) => f.patch(order.id, {
    items: order.items.map((line: any, i: number) => i === 0 ? { ...line, uzum_checkout: { ...line.uzum_checkout, ...meta } } : line),
    payment_status: meta.review_required ? "unpaid" : "waiting",
  }));
  f.link.mockImplementation(async (order: any, meta: any) => { f.links.set(meta.contract_id, { contract_id: meta.contract_id, order_row_id: order.id, uzum_order_id: meta.uzum_order_id, period: meta.period }); });
  f.notify.mockResolvedValue(undefined);
  f.activate.mockImplementation(async (order: any) => f.patch(order.id, { status: "processing", payment_status: "paid" }));
});

describe("durable Uzum checkout", () => {
  it("persists the order before the bank call and binds the contract before redirect", async () => {
    const result = await startCheckout(input);
    expect(f.events).toEqual(["persist", "bank-create"]);
    expect(result.order_row_id).toBe(input.request_id);
    expect(f.rows.get(input.request_id).items[0].uzum_checkout.contract_id).toBe(777);
    expect(f.link).toHaveBeenCalled();
  });
  it("does not create a second contract on a retry or concurrent request", async () => {
    await Promise.all([startCheckout(input), startCheckout(input)]);
    await startCheckout(input);
    expect(f.create).toHaveBeenCalledTimes(1);
    expect(f.rows.size).toBe(1);
  });
  it("does not call orders for a stale calculator quote", async () => {
    await expect(startCheckout({ ...input, expected_total: 700000 })).rejects.toThrow(/o'zgardi/);
    expect(f.create).not.toHaveBeenCalled();
  });
  it("does not repeat an ambiguous bank timeout", async () => {
    f.create.mockRejectedValueOnce(new Error("timeout"));
    await expect(startCheckout(input)).rejects.toThrow();
    const result = await startCheckout(input);
    expect(result.recovery_path).toContain(input.request_id);
    expect(f.create).toHaveBeenCalledTimes(1);
  });
  it("repairs a failed contract link on retry without recreating the loan", async () => {
    f.link.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(startCheckout(input)).rejects.toThrow();
    await startCheckout(input);
    expect(f.create).toHaveBeenCalledTimes(1);
    expect(f.link).toHaveBeenCalledTimes(2);
  });
  it("requires the private recovery token", async () => {
    await startCheckout(input);
    await expect(authorizeCheckout(input.request_id, "wrong-token")).rejects.toThrow();
    expect((await authorizeCheckout(input.request_id, input.recovery_token)).id).toBe(input.request_id);
  });
  it("does not turn unsigned moderation into a purchase", async () => {
    await startCheckout(input);
    f.status.mockResolvedValue({ data: { contract_id: 777, contract_status: 2, is_signed: false } });
    expect((await finishCheckout(input.request_id)).state).toBe("pending");
    expect(f.notify).not.toHaveBeenCalled();
  });
  it("finalizes the saved order without inserting a second one", async () => {
    await startCheckout(input);
    expect((await finishCheckout(input.request_id)).state).toBe("signed");
    expect((await finishCheckout(input.request_id)).state).toBe("signed");
    expect(f.rows.size).toBe(1);
    expect(f.rows.get(input.request_id).items[0].uzum_checkout.signed).toBe(true);
  });
  it("does not report success if the contract mapping cannot be saved", async () => {
    await startCheckout(input); f.link.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(finishCheckout(input.request_id)).rejects.toThrow();
    expect(f.rows.get(input.request_id).items[0].uzum_checkout.signed).not.toBe(true);
  });
  it("resolves numeric external ids and ignores the claimed paid status", async () => {
    await startCheckout(input);
    const ext = f.rows.get(input.request_id).items[0].uzum_checkout.ext_order_id;
    f.status.mockResolvedValue({ data: { contract_id: 777, contract_status: 0, is_signed: false } });
    expect((await processUzumWebhook({ ext_order_id: ext, contract_id: 777, status: "PAID" })).state).toBe("pending");
  });
  it("rejects a webhook contract that belongs to another checkout", async () => {
    await startCheckout(input);
    const ext = f.rows.get(input.request_id).items[0].uzum_checkout.ext_order_id;
    await expect(processUzumWebhook({ ext_order_id: ext, contract_id: 999 })).rejects.toThrow();
    expect(f.status).not.toHaveBeenCalled();
  });
  it("keeps a mismatched contract blocked even when linking initially fails", async () => {
    f.create.mockResolvedValueOnce({ data: { paymart_client: { contract_id: 777, order: 888, total: "900000", price_month: "300000" }, webview_path: "https://auth.uzumnasiya.uz/sign" } });
    f.link.mockRejectedValueOnce(new Error("storage unavailable"));
    await expect(startCheckout(input)).rejects.toThrow();
    expect((await startCheckout(input)).webview_path).toBeUndefined();
    expect((await finishCheckout(input.request_id)).needs_review).toBe(true);
    expect(f.create).toHaveBeenCalledTimes(1);
  });
  it("processes a cancellation webhook even after browser completion", async () => {
    await startCheckout(input); await finishCheckout(input.request_id);
    f.status.mockResolvedValueOnce({ data: { contract_id: 777, contract_status: 5, is_signed: true } });
    expect((await processUzumWebhook({ contract_id: 777 })).state).toBe("cancelled");
    expect(f.rows.get(input.request_id).payment_status).toBe("cancelled");
  });
  it("repairs a lost order update using a signed receipt without another bank create", async () => {
    f.patch.mockRejectedValueOnce(new Error("order update unavailable"));
    let receipt = "";
    try { await startCheckout(input); } catch (error) { receipt = (error as { recoveryReceipt: string }).recoveryReceipt; }
    expect(receipt).toBeTruthy();
    expect(f.links.has(777)).toBe(true);
    expect((await startCheckout({ ...input, recovery_receipt: receipt })).webview_path).toContain("/sign");
    expect(f.create).toHaveBeenCalledTimes(1);
  });
  it("retains a recoverable bank result even if both persistence writes fail", async () => {
    f.patch.mockRejectedValueOnce(new Error("storage unavailable"));
    f.link.mockRejectedValueOnce(new Error("storage unavailable"));
    let receipt = "";
    try { await startCheckout(input); } catch (error) { receipt = (error as { recoveryReceipt: string }).recoveryReceipt; }
    expect(receipt).toBeTruthy();
    await expect(startCheckout({ ...input, recovery_receipt: receipt.slice(0, -1) + "x" })).rejects.toThrow(/yaroqsiz/);
    expect((await startCheckout({ ...input, recovery_receipt: receipt })).contract_id).toBe(777);
    expect(f.create).toHaveBeenCalledTimes(1);
  });
  it("does not bypass quote review using a mapping without the trusted bank metadata", async () => {
    f.patch.mockRejectedValueOnce(new Error("order update unavailable"));
    await expect(startCheckout(input)).rejects.toThrow();
    expect((await processUzumWebhook({ contract_id: 777 })).state).toBe("pending");
    expect(f.status).not.toHaveBeenCalled();
  });
  it("preserves a completion that races a delayed bank-result write", async () => {
    f.writeBank.mockImplementationOnce(async (order: any, meta: any) => {
      Object.assign(f.rows.get(order.id), { items: order.items.map((line: any, i: number) => i === 0
        ? { ...line, uzum_checkout: { ...meta, signed: true, notification: "sent" } } : line), payment_status: "paid", status: "processing" });
      return null;
    });
    const result = await startCheckout(input);
    expect(result.webview_path).toBeUndefined();
    expect(f.rows.get(input.request_id).payment_status).toBe("paid");
    expect(f.rows.get(input.request_id).items[0].uzum_checkout.signed).toBe(true);
  });
  it("does not revive an order cancelled during an activation status check", async () => {
    await startCheckout(input); await finishCheckout(input.request_id);
    f.status.mockResolvedValue({ data: { contract_id: 777, contract_status: 1, is_signed: true } });
    f.activate.mockImplementationOnce(async () => { await f.patch(input.request_id, { status: "cancelled", payment_status: "cancelled" }); return null; });
    expect((await finishCheckout(input.request_id, true)).state).toBe("cancelled");
    expect(f.rows.get(input.request_id).payment_status).toBe("cancelled");
  });
  it("does not complete an unsigned checkout cancelled during a signature status check", async () => {
    await startCheckout(input);
    f.status.mockImplementationOnce(async () => { await f.patch(input.request_id, { status: "cancelled" }); return { data: { contract_id: 777, contract_status: 1, is_signed: true } }; });
    expect((await finishCheckout(input.request_id)).state).toBe("cancelled");
    expect(f.rows.get(input.request_id).status).toBe("cancelled");
  });
});
