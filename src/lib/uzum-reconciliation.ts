import type { CheckoutOrder } from "./uzum-checkout-store";

/** Oldest check first: abandoned checkouts cannot monopolize a bounded bank-status batch. */
export function reconciliationCandidates(rows: CheckoutOrder[], linked = new Set<string>(), limit = 3): CheckoutOrder[] {
  return rows.filter(row => {
    const meta = row.items?.[0]?.uzum_checkout;
    return row.order_type === "uzum_nasiya" && row.status !== "cancelled" &&
      (meta?.contract_id || linked.has(row.id)) && (!meta?.signed || meta.notification !== "sent");
  }).sort((a, b) => (a.items?.[0]?.uzum_checkout?.last_checked_at || 0) - (b.items?.[0]?.uzum_checkout?.last_checked_at || 0)).slice(0, limit);
}

export function canClaimNotification(meta: { notification?: string; notification_claimed_at?: number }, now = Date.now()): boolean {
  return meta.notification === "pending" || (meta.notification === "sending" && (meta.notification_claimed_at || 0) < now - 120000);
}
