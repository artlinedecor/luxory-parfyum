import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkoutRequest, readCheckoutRequest, saveCheckoutReceipt } from "./uzum-checkout-session";

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("sessionStorage", { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
});
describe("checkout request recovery", () => {
  it("reuses the same request and private token after a lost response", () => {
    expect(checkoutRequest("same-cart")).toEqual(checkoutRequest("same-cart"));
  });
  it("does not silently start another loan when the cart changes after an uncertain request", () => {
    const old = checkoutRequest("old-cart");
    expect(() => checkoutRequest("changed-cart")).toThrow(/Oldingi/);
    expect(readCheckoutRequest()?.request_id).toBe(old.request_id);
  });
  it("retains the signed bank response receipt on retries", () => {
    const old = checkoutRequest("same-cart"); saveCheckoutReceipt(old.request_id, "signed-receipt");
    expect(checkoutRequest("same-cart").recovery_receipt).toBe("signed-receipt");
  });
  it("does not begin a bank request without retaining its retry identity", () => {
    vi.stubGlobal("sessionStorage", { getItem: () => null, setItem: () => { throw new Error("storage blocked"); } });
    expect(() => checkoutRequest("same-cart")).toThrow(/storage blocked/);
  });
});
