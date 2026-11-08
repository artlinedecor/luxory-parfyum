import { createHmac, timingSafeEqual } from "node:crypto";

export type AlifMode = "sandbox" | "production";
export interface AlifConfig { mode: AlifMode; api: string; checkout: string; token: string; secret: string;
  fiscal?: { spic: string; vat_percent: number } }
export class AlifError extends Error {
  attemptNotCreated = false;
  constructor(message: string, public status = 409, public recoveryReceipt?: string) { super(message); }
}

/** Endpoints are fixed: environment values cannot redirect merchant credentials. */
export function alifConfig(mode = process.env.ALIFPAY_MODE): AlifConfig {
  if (mode !== "sandbox" && mode !== "production") throw new AlifError("Alif hozircha ulanmagan", 503);
  const sandbox = mode === "sandbox";
  const token = sandbox ? process.env.ALIFPAY_TEST_API_TOKEN : process.env.ALIFPAY_API_TOKEN;
  const secret = sandbox ? process.env.ALIFPAY_TEST_WEBHOOK_SECRET : process.env.ALIFPAY_WEBHOOK_SECRET;
  const fiscalMode = process.env.ALIFPAY_FISCAL_MODE;
  let fiscal: AlifConfig["fiscal"];
  if (fiscalMode === "alif") {
    const spic = process.env.ALIFPAY_SPIC || "", vat = process.env.ALIFPAY_VAT_PERCENT;
    if (!/^\d{17}$/.test(spic) || !vat?.trim() || !Number.isInteger(Number(vat)) || Number(vat) < 0 || Number(vat) > 100) {
      throw new AlifError("Alif fiskal chek rekvizitlari to'liq emas", 503);
    }
    fiscal = { spic, vat_percent: Number(vat) };
  }
  if (!token || !secret || (!sandbox && fiscalMode !== "external" && fiscalMode !== "alif")) {
    throw new AlifError("Alif sozlamalari to'liq emas", 503);
  }
  return { mode, token, secret, fiscal, api: sandbox ? "https://api-dev.alifpay.uz/v2" : "https://api.alifpay.uz/v2",
    checkout: sandbox ? "https://checkout-dev.alifpay.uz/" : "https://checkout.alifpay.uz/" };
}

export function toTiyin(uzs: number): number {
  const value = uzs * 100;
  if (!Number.isSafeInteger(value) || value <= 0) throw new AlifError("To'lov summasi yaroqsiz", 400);
  return value;
}

export interface AlifInvoice {
  id: string; price: number; meta?: { order_id?: string; mode?: string };
  payment?: { id?: string; amount?: number; status?: string; receipt?: { results?: { url?: string }[] } };
}

/** No simulation, SMS, charge or refund method is exposed by the app client. */
export async function alifRequest(method: "invoice" | "getInvoice", body: unknown, config: AlifConfig): Promise<AlifInvoice> {
  let response: Response;
  try {
    response = await fetch(`${config.api}/${method}`, { method: "POST", redirect: "error", cache: "no-store",
      headers: { "Content-Type": "application/json", Token: config.token }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  } catch { throw new AlifError("Alif bilan aloqa uzildi. Mavjud buyurtma holatini qayta tekshiring.", 503); }
  if (!response.ok) throw new AlifError(`Alif javob bermadi (HTTP ${response.status})`, 502);
  let value;
  try { value = await response.json(); } catch { throw new AlifError("Alif javobi yaroqsiz", 502); }
  if (value?.error) throw new AlifError(`Alif so'rovni qabul qilmadi (${Number(value.error.code) || "unknown"})`, 502);
  if (!value || typeof value.id !== "string" || !value.id || value.id.length > 128 || !Number.isSafeInteger(value.price)) throw new AlifError("Alif hisob ma'lumoti yaroqsiz", 502);
  return value;
}

export function verifyAlifSignature(raw: Uint8Array, signature: string | null, secret: string): boolean {
  if (!secret || !signature || !/^[A-Za-z0-9+/]{43}=$/.test(signature)) return false;
  const received = Buffer.from(signature, "base64");
  const expected = createHmac("sha256", secret).update(raw).digest();
  return received.length === expected.length && timingSafeEqual(received, expected);
}
export function alifPaymentState(status?: string): "paid" | "refunded" | "pending" {
  return status === "SUCCEEDED" ? "paid" : status === "REVERTED" ? "refunded" : "pending";
}

export function isAlifOrder(row: { items?: unknown } | null | undefined): boolean {
  return Array.isArray(row?.items) && !!row.items[0]?.alif_checkout;
}
export function isAlifSandboxOrder(row: { items?: unknown } | null | undefined): boolean {
  return Array.isArray(row?.items) && row.items[0]?.alif_checkout?.mode === "sandbox";
}
