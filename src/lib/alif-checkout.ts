import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { siteConfig } from "@/config/site";
import { computeOrderTotal } from "./pricing-server";
import { alifConfig, alifRequest, alifPaymentState, AlifError, toTiyin, type AlifConfig, type AlifInvoice } from "./alifpay";
import { alifStore, type AlifMeta, type AlifOrder } from "./alif-checkout-store";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const equal = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const alifMeta = (row: AlifOrder) => row.items[0].alif_checkout!;
const withMeta = (row: AlifOrder, meta: AlifMeta) => row.items.map((line, i) => i ? line : { ...line, alif_checkout: meta });
export interface AlifStartInput {
  request_id: string; recovery_token: string; recovery_receipt?: string; expected_total: number;
  items: { product_id: string; quantity: number }[];
  client: { name: string; phone: string; region: string; address: string };
}

export async function authorizeAlifCheckout(id: string, token: string): Promise<AlifOrder> {
  if (!uuid.test(id || "") || typeof token !== "string" || token.length < 32 || token.length > 128) throw new AlifError("Buyurtma havolasi yaroqsiz", 403);
  const row = await alifStore.get(id);
  if (!row || !equal(alifMeta(row).token_hash, hash(token))) throw new AlifError("Buyurtmani boshlangan brauzerda oching", 403);
  return row;
}
function result(row: AlifOrder, config: AlifConfig) {
  const meta = alifMeta(row);
  return { order_id: row.id, total_uzs: row.total_amount, state: meta.state, order_status: row.status, sandbox: meta.mode === "sandbox",
    checkout_url: meta.invoice_id && Date.now() - meta.created_at < 3600000 && meta.state === "pending" ? `${config.checkout}?invoice=${encodeURIComponent(meta.invoice_id)}` : undefined,
    expired: Date.now() - meta.created_at >= 3600000 };
}
function validateInvoice(invoice: AlifInvoice, row: AlifOrder, invoiceId: string) {
  if (invoice.id !== invoiceId || invoice.price !== toTiyin(row.total_amount) ||
      invoice.meta?.order_id !== row.id || invoice.meta?.mode !== alifMeta(row).mode ||
      (invoice.payment && (invoice.payment.status || invoice.payment.amount !== undefined) && invoice.payment.amount !== toTiyin(row.total_amount))) throw new AlifError("Alif hisobi buyurtmaga mos kelmadi. Do'kon bilan bog'laning.", 409);
}
function recoveryReceipt(row: AlifOrder, invoiceId: string, config: AlifConfig) {
  const body = Buffer.from(JSON.stringify({ order_id: row.id, invoice_id: invoiceId, total: row.total_amount, mode: config.mode })).toString("base64url");
  return `${body}.${createHmac("sha256", config.secret).update(body).digest("base64url")}`;
}
function readReceipt(receipt: string, row: AlifOrder, config: AlifConfig): string {
  try {
    if (receipt.length > 2048) throw new Error();
    const [body, sig, extra] = receipt.split(".");
    if (extra || !body || !sig || !equal(sig, createHmac("sha256", config.secret).update(body).digest("base64url"))) throw new Error();
    const value = JSON.parse(Buffer.from(body, "base64url").toString());
    if (value.order_id !== row.id || value.total !== row.total_amount || value.mode !== config.mode || typeof value.invoice_id !== "string") throw new Error();
    return value.invoice_id;
  } catch { throw new AlifError("Hisobni tiklash ma'lumoti yaroqsiz", 403); }
}
async function bindInvoice(row: AlifOrder, invoiceId: string, config: AlifConfig) {
  try {
    const updated = await alifStore.cas(row, { items: withMeta(row, { ...alifMeta(row), invoice_id: invoiceId }) });
    if (updated) return updated;
    const current = await alifStore.get(row.id);
    if (current && alifMeta(current).invoice_id === invoiceId) return current;
  } catch { /* caller retains signed recovery mapping */ }
  throw new AlifError("Hisob ochildi, bog'lanishni saqlab bo'lmadi. Qayta tekshiring.", 503, recoveryReceipt(row, invoiceId, config));
}

export async function recoverAlifCheckout(id: string, token: string, receipt?: string) {
  const row = await authorizeAlifCheckout(id, token);
  if (alifMeta(row).invoice_id || !receipt) return row;
  const config = alifConfig(alifMeta(row).mode);
  const invoiceId = readReceipt(receipt, row, config);
  validateInvoice(await alifRequest("getInvoice", { id: invoiceId }, config), row, invoiceId);
  return bindInvoice(row, invoiceId, config);
}

export async function startAlifCheckout(input: AlifStartInput) {
  const config = alifConfig();
  if (!input || !uuid.test(input.request_id || "") || typeof input.recovery_token !== "string" || input.recovery_token.length < 32 || input.recovery_token.length > 128 ||
      !Number.isFinite(input.expected_total) || input.expected_total <= 0 || !Array.isArray(input.items) || !input.items.length || input.items.length > 50 ||
      input.items.some(it => !it || !uuid.test(it.product_id || "") || !Number.isSafeInteger(it.quantity) || it.quantity < 1 || it.quantity > 100) ||
      !input.client || !/^998\d{9}$/.test(input.client.phone || "") ||
      ![input.client.name, input.client.region, input.client.address].every(v => typeof v === "string" && v.trim() && v.length <= 400)) {
    throw new AlifError("Savat, ism, telefon va manzilni tekshiring", 400);
  }
  const fingerprint = hash(JSON.stringify({ items: input.items, client: input.client, total: input.expected_total, mode: config.mode }));
  let row = await alifStore.get(input.request_id);
  if (row) {
    row = await authorizeAlifCheckout(input.request_id, input.recovery_token);
    if (alifMeta(row).fingerprint !== fingerprint) throw new AlifError("Oldingi buyurtma holatini avval tekshiring", 409);
    if (!alifMeta(row).invoice_id && input.recovery_receipt) {
      const id = readReceipt(input.recovery_receipt, row, config);
      validateInvoice(await alifRequest("getInvoice", { id }, config), row, id);
      row = await bindInvoice(row, id, config);
    }
    if (!alifMeta(row).invoice_id) throw new AlifError("Oldingi hisob natijasi kutilmoqda. Yangi hisob ochmang, do'kon bilan bog'laning.", 409);
    return result(row, config);
  }
  const { lines, totalUzs } = await computeOrderTotal(input.items);
  if (totalUzs !== input.expected_total) {
    const error = new AlifError("Narx yangilangan. Savatni yangilab qayta urinib ko'ring.", 409);
    error.attemptNotCreated = true; throw error;
  }
  toTiyin(totalUzs);
  const origin = process.env.ALIFPAY_SITE_URL || siteConfig.siteUrl;
  const base = new URL(origin);
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash) throw new AlifError("Alif qaytish manzili sozlanmagan", 503);
  const meta: AlifMeta = { mode: config.mode, token_hash: hash(input.recovery_token), fingerprint, state: "pending", created_at: Date.now() };
  row = { id: input.request_id, items: lines.map((line, i) => i ? line : { ...line, alif_checkout: meta }),
    client_name: config.mode === "sandbox" ? `[ALIF TEST] ${input.client.name}` : input.client.name,
    client_phone: input.client.phone, region: `${input.client.region} — ${input.client.address}`, total_amount: totalUzs,
    order_type: "full_payment", status: config.mode === "sandbox" ? "cancelled" : "pending", payment_status: "unpaid" };
  if (!await alifStore.insert(row)) throw new AlifError("Buyurtma yaratilmoqda. Mavjud hisobni qayta tekshiring.", 409);
  const returnUrl = new URL(`/alif-payment?order_id=${row.id}`, base).toString();
  const invoice = await alifRequest("invoice", {
    items: lines.map(line => ({ name: line.title, amount: line.quantity, price: toTiyin(line.price_uzs), ...config.fiscal })),
    receipt: !!config.fiscal, ...(config.fiscal ? { phone: input.client.phone } : {}), timeout: 3600, redirect_url: returnUrl, cancel_url: returnUrl,
    webhook_url: new URL(`/api/alifpay/webhook?order_id=${row.id}`, base).toString(), meta: { order_id: row.id, mode: config.mode },
  }, config);
  // Retain a signed mapping even if the provider response or DB validation is unexpected.
  try { validateInvoice(invoice, row, invoice.id); }
  catch { throw new AlifError("Alif hisobini tekshirish kerak. Do'kon bilan bog'laning.", 409, recoveryReceipt(row, invoice.id, config)); }
  row = await bindInvoice(row, invoice.id, config);
  return { ...result(row, config), recovery_receipt: recoveryReceipt(row, invoice.id, config) };
}

/** The browser and signed callback both reconcile using the provider, never redirect parameters. */
export async function refreshAlifCheckout(id: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const row = await alifStore.get(id);
    if (!row) throw new AlifError("Buyurtma topilmadi", 404);
    const meta = alifMeta(row), config = alifConfig(meta.mode);
    if (!meta.invoice_id) throw new AlifError("Hisob bog'lanishi kutilmoqda. Qayta tekshiring.", 503);
    const invoice = await alifRequest("getInvoice", { id: meta.invoice_id }, config);
    validateInvoice(invoice, row, meta.invoice_id);
    const observed = alifPaymentState(invoice.payment?.status);
    // Refund is terminal; stale pending responses cannot regress a paid record.
    const state = meta.state === "refunded" ? "refunded" : observed === "pending" ? meta.state : observed;
    const changes: Partial<AlifOrder> = { items: withMeta(row, { ...meta, state }) };
    if (meta.mode === "production") {
      if (state === "paid") {
        changes.payment_status = "paid";
        // Preserve administrative cancellation/fulfilment, even on delayed successful callback.
        if (row.status === "pending") changes.status = "processing";
      } else if (state === "refunded") {
        changes.payment_status = "cancelled";
        // Delivered orders require the admin stock/accounting reversal path.
        if (row.status !== "delivered") changes.status = "cancelled";
      }
    }
    const updated = await alifStore.cas(row, changes);
    if (updated) {
      const receipt_urls = (invoice.payment?.receipt?.results || []).flatMap(item => {
        try { const url = new URL(item.url || ""); return url.protocol === "https:" && url.hostname === "ofd.soliq.uz" && !url.username && !url.password ? [url.href] : []; }
        catch { return []; }
      });
      return { ...result(updated, config), receipt_urls };
    }
  }
  throw new AlifError("Buyurtma yangilanmoqda. Qayta tekshiring.", 503);
}
