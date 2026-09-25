/**
 * Buyurtma daromadini hisoblash — YAGONA manba.
 *
 * ⚠️ Oldin bu mantiq 3 ta faylda (dashboard/page.tsx,
 * dashboard/accounting/page.tsx, dashboard/cashflow/page.tsx) alohida
 * takrorlangan edi: `item.price_at_purchase * item.quantity`. Yangi
 * (Uzum Nasiya, Click) buyurtmalarda `price_at_purchase` maydoni
 * UMUMAN yo'q — faqat `price_uzs` bor. `undefined * son = NaN`, va
 * bitta NaN butun yig'indini abadiy buzadi. 2026-09-18 da Uzum Nasiya
 * orqali kelgan birinchi buyurtma (800 000 so'm) aynan shu sababli
 * "Jami Savdo" ko'rsatkichini butunlay NaN qilib qo'ygan edi.
 *
 * Bu yerdagi funksiyalar hech qachon NaN qaytarmaydi — narx topilmasa
 * 0 qaytaradi.
 */

// Boshlang'ich kurs (egasi, 2026-09-25). Joriy kurs dashboard'da o'zgartiriladi
// (app_settings.usd_to_uzs) — bu qiymat faqat sozlama yo'q bo'lganda va kursi
// yozilmagan eski rasxodlar uchun ishlatiladi.
// Saytdagi sotuv narxlari (utils.ts, EXCHANGE_RATE) bunga bog'liq emas.
export const USD_TO_UZS = 11_870;

/** Dashboard'da kiritiladigan kurs chegaralari — xato bilan 118 yoki 1 187 000 yozilmasin. */
export const USD_RATE_MIN = 5_000;
export const USD_RATE_MAX = 50_000;

export function isValidUsdRate(rate: unknown): rate is number {
  if (rate == null || rate === "") return false;
  const n = Number(rate);
  return Number.isFinite(n) && n >= USD_RATE_MIN && n <= USD_RATE_MAX;
}

/** Dollar summasini so'mga aylantiradi (masalan cost_price_usd yoki $-dagi rasxod tranzaksiyalari uchun). */
export function usdToUzs(usd: number, rate: number = USD_TO_UZS): number {
  return (Number(usd) || 0) * rate;
}

export interface OrderItemLike {
  product_id: string;
  quantity: number;
  /** Eski maydon — DOLLARDA. */
  price_at_purchase?: number;
  /** So'mdagi haqiqiy narx — mavjud bo'lsa shu ustuvor. */
  price_uzs?: number;
}

export interface OrderLike {
  items: OrderItemLike[] | null;
}

/**
 * Bitta mahsulot qatorining BIR DONASINING so'mdagi narxi.
 *
 * price_uzs — buyurtma kiritilgan paytdagi kurs bilan muzlatilgan summa:
 * kurs keyin o'zgarsa ham tushgan pul o'zgarmaydi. U yo'q bo'lsa —
 * dollar narx `rate` bilan o'giriladi.
 * ⚠️ Eski qo'lda buyurtmalarning price_uzs'i 12 100 bilan saqlangan —
 * migrations/08 ularni 11 870 ga keltiradi.
 */
export function itemPriceUzs(item: OrderItemLike, rate: number = USD_TO_UZS): number {
  if (item.price_uzs != null && item.price_uzs > 0) {
    return item.price_uzs;
  }
  if (item.price_at_purchase != null && item.price_at_purchase > 0) {
    return Math.round(item.price_at_purchase * rate);
  }
  return 0;
}

/** Bitta buyurtmaning jami so'mdagi summasi. */
export function orderRevenueUzs(order: OrderLike, rate: number = USD_TO_UZS): number {
  const items = order.items ?? [];
  return items.reduce((sum, item) => sum + itemPriceUzs(item, rate) * (Number(item.quantity) || 0), 0);
}

/** Bir nechta buyurtmaning jami so'mdagi summasi. */
export function totalRevenueUzs(orders: OrderLike[], rate: number = USD_TO_UZS): number {
  return orders.reduce((sum, order) => sum + orderRevenueUzs(order, rate), 0);
}

const num = (v: unknown) => Number(v) || 0;

export interface LedgerTx {
  type: string;
  amount: number | string | null;
  expense_category?: string | null;
  /** Rasxod kiritilgan paytdagi kurs. Yo'q bo'lsa (eski yozuvlar) — USD_TO_UZS. */
  usd_rate?: number | string | null;
}

/** Tranzaksiyaning so'mdagi qiymati: rasxod ($) o'z kursi bilan, qolganlari allaqachon so'mda. */
export function txAmountUzs(t: LedgerTx): number {
  if (t.type !== "expense") return num(t.amount);
  const rate = isValidUsdRate(t.usd_rate) ? Number(t.usd_rate) : USD_TO_UZS;
  return num(t.amount) * rate;
}

export interface StockProduct {
  id: string;
  stock?: number | null;
  cost_price_usd?: number | null;
}

export interface CostOrder {
  items: { product_id: string; quantity: number }[] | null;
}


/**
 * Rasxod segmentlari. "inventory" (atir xaridi) omborga aktiv bo'lib yoziladi,
 * "deposit" (qaytadigan pul, masalan Uzum depoziti) ham aktiv — ikkalasi ham
 * foydani kamaytirmaydi. Qolganlari darhol foydadan ayiriladi.
 */
export const EXPENSE_SEGMENTS = ["inventory", "cargo", "ads", "services", "deposit", "other"] as const;
export type ExpenseSegment = (typeof EXPENSE_SEGMENTS)[number];

export const EXPENSE_SEGMENT_LABELS: Record<ExpenseSegment, string> = {
  inventory: "Atir xaridi",
  cargo: "Kargo va yo'l",
  ads: "Reklama (Target)",
  services: "Xizmat va obunalar",
  deposit: "Qaytadigan pul (depozit)",
  other: "Boshqa",
};

/** Eski "operating" qiymati va kategoriyasiz yozuvlar "boshqa"ga tushadi. */
export function segmentOf(category: string | null | undefined): ExpenseSegment {
  return (EXPENSE_SEGMENTS as readonly string[]).includes(category ?? "")
    ? (category as ExpenseSegment)
    : "other";
}

/**
 * Butun moliyaviy holat — dashboard'ning YAGONA hisob manbasi.
 *
 * Tranzaksiyalar jadvalida uch xil yozuv bor, valyutasi ham har xil:
 *  - capital (sarmoya, tikilgan pul) — SO'MDA; savdo emas, foydaga kirmaydi
 *  - income (savdo tushumi) — SO'MDA
 *  - expense (rasxod) — DOLLARDA ("Yangi Tranzaksiya" formasi "Summa ($)")
 * Har bir rasxod o'zi kiritilgan kurs bilan (usd_rate) so'mga o'giriladi —
 * kurs o'zgarganda eski rasxodlar qayta baholanmaydi.
 * Tan narx esa mahsulotning cost_price_usd'idan (DOLLAR), joriy kurs bilan. Ilgari bu
 * hisob 3 ta sahifada alohida takrorlanib, har biri boshqacha xato
 * qilardi — endi hammasi shu yerdan olinadi.
 */
export function summarizeFinances(input: {
  transactions: LedgerTx[];
  deliveredOrders: CostOrder[];
  products: StockProduct[];
  /** Joriy kurs — ombor va tan narx ($) uchun. */
  rate?: number;
}) {
  const { transactions, deliveredOrders, products } = input;
  const rate = isValidUsdRate(input.rate) ? input.rate : USD_TO_UZS;

  const sumOf = (pred: (t: LedgerTx) => boolean) =>
    transactions.filter(pred).reduce((s, t) => s + num(t.amount), 0);

  const capitalUzs = sumOf((t) => t.type === "capital");
  const salesUzs = sumOf((t) => t.type === "income");
  const expensesUsd = sumOf((t) => t.type === "expense");

  const expenseSegmentsUzs = Object.fromEntries(EXPENSE_SEGMENTS.map((k) => [k, 0])) as Record<ExpenseSegment, number>;
  for (const t of transactions) {
    if (t.type === "expense") expenseSegmentsUzs[segmentOf(t.expense_category)] += txAmountUzs(t);
  }

  const expensesUzs = EXPENSE_SEGMENTS.reduce((s, k) => s + expenseSegmentsUzs[k], 0);
  const inventoryPurchasesUzs = expenseSegmentsUzs.inventory;
  const depositsUzs = expenseSegmentsUzs.deposit;
  const operatingExpensesUzs = expensesUzs - inventoryPurchasesUzs - depositsUzs;

  const costOf: Record<string, number> = {};
  for (const p of products) costOf[p.id] = num(p.cost_price_usd);

  let cogsUsd = 0;
  for (const o of deliveredOrders) {
    for (const i of o.items ?? []) cogsUsd += (costOf[i.product_id] || 0) * num(i.quantity);
  }
  const cogsUzs = usdToUzs(cogsUsd, rate);

  let warehouseItems = 0;
  let warehouseUsd = 0;
  for (const p of products) {
    const stock = num(p.stock);
    if (stock <= 0) continue;
    warehouseItems += stock;
    warehouseUsd += stock * num(p.cost_price_usd);
  }
  const warehouseUzs = usdToUzs(warehouseUsd, rate);

  const cashUzs = capitalUzs + salesUzs - expensesUzs;
  const totalWorthUzs = cashUzs + warehouseUzs + depositsUzs;
  const expectedWarehouseUzs = inventoryPurchasesUzs - cogsUzs;

  return {
    capitalUzs,
    salesUzs,
    expensesUsd,
    expensesUzs,
    expenseSegmentsUzs,
    // Savdo sarmoyani necha marta aylantirgan va boylik sarmoyadan necha barobar
    salesTurnover: capitalUzs > 0 ? salesUzs / capitalUzs : 0,
    worthMultiple: capitalUzs > 0 ? totalWorthUzs / capitalUzs : 0,
    inventoryPurchasesUzs,
    depositsUzs,
    operatingExpensesUzs,
    cogsUzs,
    netProfitUzs: salesUzs - cogsUzs - operatingExpensesUzs,
    salesBalanceUzs: salesUzs - expensesUzs,
    cashUzs,
    warehouseItems,
    warehouseUzs,
    totalWorthUzs,
    realProfitUzs: totalWorthUzs - capitalUzs,
    expectedWarehouseUzs,
    warehouseGapUzs: expectedWarehouseUzs - warehouseUzs,
  };
}

export type FinanceSummary = ReturnType<typeof summarizeFinances>;
