import { describe, expect, it } from "vitest";
import { reconciliationCandidates, canClaimNotification } from "./uzum-reconciliation";
import type { CheckoutOrder } from "./uzum-checkout-store";

const row = (id: string, checked: number, signed = false, notification = "pending") => ({
  id, order_type: "uzum_nasiya", status: "pending",
  items: [{ uzum_checkout: { contract_id: 123, last_checked_at: checked, signed, notification } }],
}) as CheckoutOrder;

describe("Uzum reconciliation fairness", () => {
  it("advances beyond abandoned checkouts on the next batch", () => {
    const rows = [row("a", 100), row("b", 100), row("c", 100), row("d", 0), row("e", 0)];
    expect(reconciliationCandidates(rows).map(r => r.id)).toEqual(["d", "e", "a"]);
  });
  it("retries unfinished notifications on signed orders", () => {
    expect(reconciliationCandidates([row("sent", 0, true, "sent"), row("retry", 0, true, "pending")]).map(r => r.id)).toEqual(["retry"]);
  });
});
describe("Uzum notification lease", () => {
  it("does not take over a live worker but retries an interrupted one", () => {
    expect(canClaimNotification({ notification: "sending", notification_claimed_at: 190000 }, 200000)).toBe(false);
    expect(canClaimNotification({ notification: "sending", notification_claimed_at: 1000 }, 200000)).toBe(true);
    expect(canClaimNotification({ notification: "pending" }, 200000)).toBe(true);
    expect(canClaimNotification({ notification: "sent" }, 200000)).toBe(false);
  });
});
