import { createHmac, timingSafeEqual } from "node:crypto";
import type { UzumCheckoutMeta } from "./uzum-checkout-store";

function key() {
  const secret = process.env.INTERNAL_API_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Checkout recovery signing is not configured");
  return secret;
}
function sign(value: string) { return createHmac("sha256", key()).update(`uzum-recovery:${value}`).digest("base64url"); }

/** Bank-authenticated response can be retried after a storage failure, never edited by the browser. */
export function createRecoveryReceipt(id: string, meta: UzumCheckoutMeta): string {
  const payload = Buffer.from(JSON.stringify({ id, meta, expires: Date.now() + 7 * 86400000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function readRecoveryReceipt(receipt: string, id: string, tokenHash: string, fingerprint: string): UzumCheckoutMeta {
  if (typeof receipt !== "string" || receipt.length > 20000) throw new Error("Recovery receipt invalid");
  const parts = receipt.split(".");
  if (parts.length !== 2) throw new Error("Recovery receipt invalid");
  const expected = sign(parts[0]);
  if (parts[1].length !== expected.length || !timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expected))) throw new Error("Recovery receipt signature invalid");
  const value = JSON.parse(Buffer.from(parts[0], "base64url").toString());
  if (value.id !== id || !Number.isFinite(value.expires) || value.expires < Date.now() || value.meta?.token_hash !== tokenHash || value.meta?.fingerprint !== fingerprint) {
    throw new Error("Recovery receipt does not belong to this checkout");
  }
  return value.meta;
}
