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

export const USD_TO_UZS = 12100;

/** Dollar summasini so'mga aylantiradi (masalan cost_price_usd yoki $-dagi rasxod tranzaksiyalari uchun). */
export function usdToUzs(usd: number): number {
  return (Number(usd) || 0) * USD_TO_UZS;
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

/** Bitta mahsulot qatorining BIR DONASINING so'mdagi narxi. */
export function itemPriceUzs(item: OrderItemLike): number {
  if (item.price_uzs != null && item.price_uzs > 0) {
    return item.price_uzs;
  }
  if (item.price_at_purchase != null && item.price_at_purchase > 0) {
    return item.price_at_purchase * USD_TO_UZS;
  }
  return 0;
}

/** Bitta buyurtmaning jami so'mdagi summasi. */
export function orderRevenueUzs(order: OrderLike): number {
  const items = order.items ?? [];
  return items.reduce((sum, item) => sum + itemPriceUzs(item) * (Number(item.quantity) || 0), 0);
}

/** Bir nechta buyurtmaning jami so'mdagi summasi. */
export function totalRevenueUzs(orders: OrderLike[]): number {
  return orders.reduce((sum, order) => sum + orderRevenueUzs(order), 0);
}
