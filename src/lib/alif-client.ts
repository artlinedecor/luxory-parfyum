"use client";
export const ALIF_SESSION = "alif_checkout_request";
export interface AlifSession { request_id: string; recovery_token: string; recovery_receipt?: string; fingerprint: string; sandbox?: boolean }
export interface AlifResult { order_id: string; state: "pending" | "paid" | "refunded"; order_status: string; sandbox: boolean; checkout_url?: string; expired: boolean; total_uzs: number; receipt_urls?: string[] }
export function readAlifSession(): AlifSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(ALIF_SESSION) || "null");
    return value && typeof value.request_id === "string" && typeof value.recovery_token === "string" ? value : null;
  } catch { return null; }
}
export function writeAlifSession(value: AlifSession) { sessionStorage.setItem(ALIF_SESSION, JSON.stringify(value)); }
export function matchesAlifCart(session: AlifSession | null, items: { product_id: string; quantity: number }[]): boolean {
  try {
    const original = JSON.parse(session?.fingerprint || "null")?.items;
    const normalize = (lines: typeof items) => JSON.stringify([...lines].sort((a, b) => a.product_id.localeCompare(b.product_id)));
    return Array.isArray(original) && normalize(original) === normalize(items);
  } catch { return false; }
}
