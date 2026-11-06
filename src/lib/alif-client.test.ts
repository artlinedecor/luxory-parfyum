import { describe, expect, it } from "vitest";
import { matchesAlifCart, type AlifSession } from "./alif-client";
describe("Alif cart preservation", () => {
  const lines = [{ product_id: "a", quantity: 1 }, { product_id: "b", quantity: 2 }];
  const session: AlifSession = { request_id: "id", recovery_token: "token", fingerprint: JSON.stringify({ items: lines }) };
  it("can clear the purchased cart regardless of line order", () => {
    expect(matchesAlifCart(session, [...lines].reverse())).toBe(true);
  });
  it("preserves a cart changed while the customer was paying", () => {
    expect(matchesAlifCart(session, [...lines, { product_id: "new", quantity: 1 }])).toBe(false);
    expect(matchesAlifCart(session, [{ product_id: "a", quantity: 2 }, lines[1]])).toBe(false);
    expect(matchesAlifCart(null, lines)).toBe(false);
  });
});
