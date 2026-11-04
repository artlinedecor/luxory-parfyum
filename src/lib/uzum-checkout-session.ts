"use client";

export interface CheckoutContact { name: string; phone: string; address: string; region: string }
const CONTACT_KEY = "uzum_checkout_contact";
const REQUEST_KEY = "uzum_checkout_request";

export function saveCheckoutContact(client: CheckoutContact) {
  try { sessionStorage.setItem(CONTACT_KEY, JSON.stringify({ ...client, ts: Date.now() })); } catch { /* server checkout still works */ }
}

export function readCheckoutContact(): CheckoutContact | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(CONTACT_KEY) || "null");
    if (!value || Date.now() - value.ts > 86400000 || ![value.name, value.phone, value.address, value.region].every(v => typeof v === "string")) return null;
    return value;
  } catch { return null; }
}

/** Persist BEFORE the request: a lost response must not create another loan. */
export function checkoutRequest(fingerprint: string): { request_id: string; recovery_token: string; recovery_receipt?: string } {
  const saved = readCheckoutRequest();
  if (saved?.request_id && saved.recovery_token) {
    if (saved.fingerprint === fingerprint) return saved;
    throw new Error("Oldingi rasmiylashtirish holatini avval tekshiring. Yangi shartnoma ochishga shoshilmang.");
  }
  const request = { fingerprint, request_id: crypto.randomUUID(), recovery_token: crypto.randomUUID() };
  // Refuse to start an irreversible bank call if retry credentials cannot be retained.
  sessionStorage.setItem(REQUEST_KEY, JSON.stringify(request));
  return request;
}
export function readCheckoutRequest(): { request_id: string; recovery_token: string; recovery_receipt?: string; fingerprint?: string } | null {
  try { return JSON.parse(sessionStorage.getItem(REQUEST_KEY) || "null"); } catch { return null; }
}
export function saveCheckoutReceipt(id: string, receipt: string) {
  const request = readCheckoutRequest();
  if (request?.request_id === id) sessionStorage.setItem(REQUEST_KEY, JSON.stringify({ ...request, recovery_receipt: receipt }));
}

export function clearCheckoutSession() {
  try { sessionStorage.removeItem(CONTACT_KEY); sessionStorage.removeItem(REQUEST_KEY); } catch { /* optional client cache */ }
}
export function clearCheckoutRequest() {
  try { sessionStorage.removeItem(REQUEST_KEY); } catch { /* optional cache */ }
}
