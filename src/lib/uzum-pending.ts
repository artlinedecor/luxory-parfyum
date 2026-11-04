"use client";

import { trackMetaEvent } from "@/lib/meta-tracker";
import { clearCheckoutSession, readCheckoutRequest } from "./uzum-checkout-session";

const KEY = "uzum_pending";
export interface PendingOrder {
  order_row_id?: string;
  recovery_token?: string;
  contract_id: number;
  order: number;
  period: string;
  total: number;
  client: { name: string; phone: string; address: string; region: string };
  items: { product_id: string; title: string; quantity: number; price: number }[];
  ts: number;
}

/** Optional browser cache; the server already owns the durable order before redirect. */
export function savePending(p: PendingOrder) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* recover with the HttpOnly checkout cookie */ }
}
export function readPending(): PendingOrder | null {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "null") as PendingOrder | null;
    return p?.contract_id ? p : null;
  } catch { return null; }
}
export function clearPending() { try { localStorage.removeItem(KEY); } catch { /* optional cache */ } }

export interface PendingResult {
  state: "signed" | "pending" | "cancelled" | "none" | "error";
  webview_path?: string;
  needs_review?: boolean;
  error?: string;
}

export async function resolvePending(): Promise<PendingResult> {
  const pending = readPending();
  const queryId = new URLSearchParams(window.location.search).get("uzum_order_id");
  const request = readCheckoutRequest();
  const orderId = queryId || pending?.order_row_id || request?.request_id;
  try {
    const response = await fetch("/api/uzumnasiya/finalize", {
      method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
      body: JSON.stringify({ order_id: orderId,
        recovery_token: pending?.order_row_id === orderId ? pending?.recovery_token : request?.request_id === orderId ? request?.recovery_token : undefined,
        recovery_receipt: request?.request_id === orderId ? request?.recovery_receipt : undefined,
        contract_id: !orderId ? pending?.contract_id : undefined }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Buyurtma holatini tekshirib bo'lmadi.");
    if (result.state === "signed") {
      if (pending && (!queryId || pending.order_row_id === queryId)) {
        try {
          const savedKey = `uzum_saved_${result.order_id}`;
          if (!localStorage.getItem(savedKey)) {
            localStorage.setItem(savedKey, "1");
            trackMetaEvent("Purchase", `uzum_${result.order_id}`, {}, {
              value: Number(result.total) || pending.total, currency: "UZS", content_type: "product",
              content_ids: pending.items.map(i => i.product_id), order_id: result.order_id,
            });
          }
        } catch { /* analytics must not reverse a verified order */ }
        clearPending();
      }
      clearCheckoutSession();
    } else if (result.state === "cancelled") {
      if (!queryId || pending?.order_row_id === queryId) clearPending();
      clearCheckoutSession();
    }
    return result;
  } catch (error) {
    return { state: "error", error: error instanceof Error ? error.message : "Holatni tekshirib bo'lmadi." };
  }
}
