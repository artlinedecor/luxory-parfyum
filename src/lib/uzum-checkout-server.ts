import { createHash, timingSafeEqual } from "node:crypto";
import { checkBuyerStatus, calculateTariffs, createOrder, checkContractStatus, productIdToInt, UZUM_DEFAULT_CATEGORY, UZUM_UNIT_PIECE } from "./uzumnasiya";
import { computeOrderTotal } from "./pricing-server";
import { buyerNextStep, isSignedContract } from "./uzum-flow";
import { checkoutStore, type CheckoutOrder, type UzumCheckoutMeta } from "./uzum-checkout-store";
import { notifyUzumCheckout } from "./uzum-checkout-notify";
import { createRecoveryReceipt, readRecoveryReceipt } from "./uzum-checkout-receipt";

export const UZUM_CHECKOUT_COOKIE = "uzum_checkout";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export class CheckoutError extends Error {
  constructor(message: string, public status = 409, public recoveryReceipt?: string) { super(message); }
}
export interface StartCheckoutInput {
  request_id: string; recovery_token: string; user_id: number; period: string; expected_total: number;
  recovery_receipt?: string;
  client: { name: string; phone: string; address: string; region: string };
  products: { product_id: string; amount: number }[];
}
export function checkoutMeta(row: CheckoutOrder | null | undefined): UzumCheckoutMeta | undefined { return row?.items?.[0]?.uzum_checkout; }
function withMeta(row: CheckoutOrder, meta: UzumCheckoutMeta) {
  return row.items.map((line, index) => index === 0 ? { ...line, uzum_checkout: meta } : line);
}
const recoveryPath = (id: string) => `/payment-success?uzum_order_id=${encodeURIComponent(id)}`;

export async function authorizeCheckout(id: string, token: string): Promise<CheckoutOrder> {
  if (!uuid.test(id) || typeof token !== "string" || token.length < 32 || token.length > 128) throw new CheckoutError("Buyurtma havolasi yaroqsiz", 403);
  const order = await checkoutStore.get(id);
  const actual = checkoutMeta(order)?.token_hash;
  const expected = hash(token);
  if (!order || !actual || actual.length !== expected.length || !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) {
    throw new CheckoutError("Buyurtmani shu brauzerda qayta oching yoki do'kon bilan bog'laning.", 403);
  }
  return order;
}

function validateInput(input: StartCheckoutInput) {
  if (!uuid.test(input.request_id || "") || typeof input.recovery_token !== "string" || input.recovery_token.length < 32 || input.recovery_token.length > 128 ||
      !Number.isSafeInteger(input.user_id) || input.user_id <= 0 || typeof input.period !== "string" || input.period.length > 80 || !input.period ||
      !Number.isFinite(input.expected_total) || input.expected_total <= 0 || !Array.isArray(input.products) || !input.products.length || input.products.length > 100 ||
      input.products.some(p => typeof p.product_id !== "string" || !Number.isSafeInteger(p.amount) || p.amount < 1 || p.amount > 100)) {
    throw new CheckoutError("Savat yoki so'rov to'liq emas. Sahifani yangilab qayta urinib ko'ring.", 400);
  }
  if (!input.client || !/^998\d{9}$/.test(input.client.phone || "") ||
      ![input.client.name, input.client.address, input.client.region].every(v => typeof v === "string" && v.trim().length > 0 && v.length <= 400)) {
    throw new CheckoutError("Ism, telefon, hudud va manzilni to'liq kiriting.", 400);
  }
}

async function resume(order: CheckoutOrder, link = true) {
  const meta = checkoutMeta(order)!;
  if (link && meta.contract_id) await checkoutStore.link(order, meta, order.status === "cancelled" ? "cancelled" : order.payment_status === "paid" ? "confirmed" : meta.signed ? "signed" : "created");
  return { success: true, order_row_id: order.id, recovery_path: recoveryPath(order.id),
    contract_id: meta.contract_id, order: meta.uzum_order_id, ext_order_id: meta.ext_order_id,
    webview_path: meta.signed || order.payment_status === "paid" || order.status === "cancelled" ? undefined : meta.webview_path,
    price_month: meta.price_month, total: meta.quoted_total, client_act_pdf: meta.client_act_pdf };
}

async function persistBankResult(order: CheckoutOrder, meta: UzumCheckoutMeta) {
  async function saveOrder() {
    let current = order;
    for (let attempt = 0; attempt < 3; attempt++) {
      const currentMeta = checkoutMeta(current);
      if (currentMeta?.contract_id && currentMeta.contract_id !== meta.contract_id) throw new Error("Bank result conflicts with saved contract");
      if (currentMeta?.signed || current.status === "cancelled") return current;
      const saved = await checkoutStore.writeBank(current, meta);
      if (saved) return saved;
      const fresh = await checkoutStore.get(current.id);
      if (!fresh) throw new Error("Checkout disappeared during recovery");
      current = fresh;
    }
    throw new Error("Checkout changed during recovery; retry required");
  }
  const [saved, linked] = await Promise.allSettled([
    saveOrder(),
    checkoutStore.link(order, meta, "created"),
  ]);
  if (saved.status === "rejected" || linked.status === "rejected") {
    // Either table can retain the binding. The signed receipt also lets the buyer repair both writes.
    throw new CheckoutError("Uzum javobi olindi, saqlash yakunlanmadi. Shu buyurtmani qayta tekshiring; yangi shartnoma ochmang.", 503, createRecoveryReceipt(order.id, meta));
  }
  return saved.value;
}

export async function repairCheckout(order: CheckoutOrder, receipt?: string): Promise<CheckoutOrder> {
  const current = checkoutMeta(order);
  if (!current || current.signed || order.status === "cancelled") return order;
  if (receipt) {
    let meta: UzumCheckoutMeta;
    try { meta = readRecoveryReceipt(receipt, order.id, current.token_hash, current.fingerprint); }
    catch { throw new CheckoutError("Buyurtmani tiklash ma'lumoti yaroqsiz", 403); }
    if (current.contract_id && current.contract_id !== meta.contract_id) throw new CheckoutError("Shartnoma ma'lumoti mos kelmadi", 409);
    return persistBankResult(order, meta);
  }
  return order;
}

/** The order primary key is the cross-process lock. Never retry an uncertain bank create. */
export async function startCheckout(input: StartCheckoutInput) {
  validateInput(input);
  const fingerprint = hash(JSON.stringify({ user_id: input.user_id, period: input.period, client: input.client,
    products: [...input.products].sort((a, b) => a.product_id.localeCompare(b.product_id)) }));
  const existing = await checkoutStore.get(input.request_id);
  if (existing) {
    await authorizeCheckout(input.request_id, input.recovery_token);
    if (checkoutMeta(existing)?.fingerprint !== fingerprint) throw new CheckoutError("Savat o'zgardi. Avval oldingi buyurtma holatini tekshiring.");
    return resume(await repairCheckout(existing, input.recovery_receipt));
  }
  const buyer = await checkBuyerStatus(Number(input.client.phone), 0);
  const next = buyerNextStep(buyer.data);
  if (next.step !== "calculate" || next.userId !== input.user_id) throw new CheckoutError(next.message || "Uzum raqamini qayta tekshiring.");
  const { lines, totalUzs } = await computeOrderTotal(input.products.map(p => ({ product_id: p.product_id, quantity: p.amount })));
  const products = lines.map(l => ({ product_id: productIdToInt(l.product_id), price: l.price_uzs, amount: l.quantity }));
  const calculated = await calculateTariffs(input.user_id, products, 0);
  const tariff = calculated.data.find(t => t.tariff === input.period && t.is_available === true);
  if (!tariff) throw new CheckoutError("Tanlangan tarif hozir mavjud emas. Limitni va tariflarni qayta tekshiring.");
  if (!Number.isFinite(Number(tariff.total)) || Math.abs(Number(tariff.total) - input.expected_total) > 0.01) {
    throw new CheckoutError("Tarif summasi o'zgardi. Tariflarni qayta hisoblab, yangi shartlarni tasdiqlang.");
  }
  // Keep the known-working positive 31-bit API range, stable across retries.
  const extId = parseInt(hash(input.request_id).slice(0, 8), 16) % 2147483647 || 1;
  if (await checkoutStore.byExternal(extId)) throw new CheckoutError("Buyurtma raqami band. Sahifani yangilab qayta urinib ko'ring.");
  const meta: UzumCheckoutMeta = { ext_order_id: extId,
    token_hash: hash(input.recovery_token), fingerprint, buyer_id: input.user_id, period: input.period, quoted_total: Number(tariff.total) };
  const order: CheckoutOrder = { id: input.request_id, items: lines, client_name: input.client.name,
    client_phone: input.client.phone, client_address: input.client.address, region: input.client.region,
    order_type: "uzum_nasiya", status: "pending", payment_status: "unpaid", total_amount: totalUzs };
  order.items = withMeta(order, meta);
  if (!await checkoutStore.insert(order)) {
    const saved = await authorizeCheckout(input.request_id, input.recovery_token);
    if (checkoutMeta(saved)?.fingerprint !== fingerprint) throw new CheckoutError("Savat o'zgardi. Buyurtma holatini tekshiring.");
    return resume(saved);
  }
  let result;
  try {
    const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://parfumelux.uz").replace(/\/$/, "");
    result = await createOrder({ user_id: input.user_id, period: input.period, ext_order_id: meta.ext_order_id,
      callback: `${base}${recoveryPath(order.id)}`, products: lines.map(l => ({ product_id: productIdToInt(l.product_id),
        name: l.title.slice(0, 255), price: l.price_uzs, amount: l.quantity, category: UZUM_DEFAULT_CATEGORY, unit_id: UZUM_UNIT_PIECE })) });
  } catch (error) {
    await checkoutStore.patch(order.id, { payment_status: "unpaid" });
    console.error("[uzum/create] bank result uncertain", { order_id: order.id, error: error instanceof Error ? error.message : "unknown" });
    throw new CheckoutError("Uzum javobini tasdiqlab bo'lmadi. Yangi shartnoma yaratilmadi deb hisoblamang; shu buyurtma holatini tekshiring yoki do'kon bilan bog'laning.", 502);
  }
  const bank = result.data;
  if (!Number.isSafeInteger(bank.paymart_client?.contract_id) || bank.paymart_client.contract_id <= 0 || !Number.isSafeInteger(bank.paymart_client.order) || bank.paymart_client.order <= 0) {
    throw new CheckoutError("Uzum shartnoma identifikatorini qaytarmadi. Do'kon bilan bog'laning.", 502);
  }
  let secureWebview = false;
  try { secureWebview = new URL(bank.webview_path).protocol === "https:"; } catch { /* malformed upstream URL */ }
  const review = !secureWebview || !Number.isFinite(Number(bank.paymart_client.total)) || Math.abs(Number(bank.paymart_client.total) - meta.quoted_total) > 0.01 ||
    !Number.isFinite(Number(bank.paymart_client.price_month)) || Math.abs(Number(bank.paymart_client.price_month) - Number(tariff.month)) > 1;
  Object.assign(meta, { contract_id: bank.paymart_client.contract_id, uzum_order_id: bank.paymart_client.order,
    webview_path: review ? undefined : bank.webview_path, review_required: review,
    price_month: bank.paymart_client.price_month, client_act_pdf: bank.client_act_pdf, notification: "pending" });
  const saved = await persistBankResult(order, meta);
  // A database error here blocks redirect; retry repairs this exact contract instead of creating another one.
  if (review) {
    throw new CheckoutError("Shartnoma summasi tarifdan farq qildi. Imzolashdan oldin do'kon bilan bog'laning.");
  }
  return resume(saved, false);
}

export async function finishCheckout(id: string, refresh = false) {
  let order = await checkoutStore.get(id);
  if (!order) throw new CheckoutError("Buyurtma topilmadi", 404);
  if (refresh || !checkoutMeta(order)?.signed) order = await checkoutStore.touchChecked(order) || await checkoutStore.get(id);
  if (!order) throw new CheckoutError("Buyurtma topilmadi", 404);
  let meta = checkoutMeta(order);
  // A mapping alone cannot prove the quote matched. Require trusted receipt repair first.
  if (!meta) {
    const legacy = await checkoutStore.contractForOrder(id);
    if (!legacy) throw new CheckoutError("Eski shartnomani do'kon orqali tekshiring.", 409);
    meta = { ...legacy, ext_order_id: 0, token_hash: "", fingerprint: "", buyer_id: 0, quoted_total: order.total_amount };
  }
  if (order.status === "cancelled" || order.payment_status === "cancelled") return { state: "cancelled" as const, order_id: id };
  if (!meta.contract_id || meta.review_required) return { state: "pending" as const, order_id: id, needs_review: true };
  if (meta.signed && !refresh) {
    await notifyUzumCheckout(order, meta);
    return { state: "signed" as const, order_id: id, total: meta.quoted_total };
  }
  const checked = await checkContractStatus(meta.contract_id, 1);
  if (checked.data.contract_id && Number(checked.data.contract_id) !== meta.contract_id) throw new CheckoutError("Uzum shartnoma javobi mos kelmadi", 502);
  const status = Number(checked.data.contract_status);
  if (status === 5) {
    await checkoutStore.link(order, meta, "cancelled");
    await checkoutStore.patch(id, { status: "cancelled", payment_status: "cancelled" });
    return { state: "cancelled" as const, order_id: id };
  }
  if (!isSignedContract(checked.data)) return { state: "pending" as const, order_id: id, webview_path: meta.webview_path };
  if (meta.signed) {
    await checkoutStore.link(order, meta, status === 1 ? "confirmed" : "signed");
    const current = status === 1 && order.payment_status !== "paid"
      ? await checkoutStore.activate(order) || await checkoutStore.get(id) : order;
    if (!current) throw new CheckoutError("Buyurtma topilmadi", 404);
    if (current.status === "cancelled" || current.payment_status === "cancelled") return { state: "cancelled" as const, order_id: id };
    await notifyUzumCheckout(current, checkoutMeta(current) || meta);
    return { state: "signed" as const, order_id: id, total: meta.quoted_total };
  }
  const signed = { ...meta, signed: true, notification: meta.notification || "pending" as const };
  await checkoutStore.link(order, signed, status === 1 ? "confirmed" : "signed");
  const saved = await checkoutStore.complete(order, { items: withMeta(order, signed),
    status: ["accepted", "delivered"].includes(order.status) ? order.status : status === 1 ? "processing" : "pending", payment_status: status === 1 ? "paid" : "pending" });
  if (!saved) {
    const current = await checkoutStore.get(id);
    if (current?.status === "cancelled" || current?.payment_status === "cancelled") return { state: "cancelled" as const, order_id: id };
    if (!current || !checkoutMeta(current)?.signed) throw new CheckoutError("Buyurtma holati o'zgardi. Qayta tekshiring.");
    await notifyUzumCheckout(current, checkoutMeta(current)!);
  } else await notifyUzumCheckout(saved, signed);
  return { state: "signed" as const, order_id: id, total: meta.quoted_total };
}

/** Webhook body only selects an already-bound checkout; bank status is authoritative. */
export async function processUzumWebhook(body: { ext_order_id?: unknown; order_id?: unknown; contract_id?: unknown; status?: unknown; data?: Record<string, unknown> }) {
  const nested = body.data || {};
  const contractId = Number(body.contract_id ?? nested.contract_id ?? (nested.paymart_client as { contract_id?: number } | undefined)?.contract_id);
  const external = body.ext_order_id ?? nested.ext_order_id ?? body.order_id ?? nested.order_id;
  let row: CheckoutOrder | null = null;
  if (external && Number.isSafeInteger(Number(external))) row = await checkoutStore.byExternal(Number(external));
  if (external && uuid.test(String(external))) row = await checkoutStore.get(String(external));
  if (!row && Number.isSafeInteger(contractId) && contractId > 0) row = await checkoutStore.byContract(contractId);
  if (!row) throw new CheckoutError("Webhook buyurtmasi hali bog'lanmagan", 409);
  const bound = checkoutMeta(row)?.contract_id ?? (await checkoutStore.contractForOrder(row.id))?.contract_id;
  if (!bound || (Number.isFinite(contractId) && contractId > 0 && bound !== contractId)) throw new CheckoutError("Webhook shartnomasi buyurtmaga mos kelmadi", 409);
  return finishCheckout(row.id, true);
}
