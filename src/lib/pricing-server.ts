import { createClient } from "@supabase/supabase-js";
import { calculateOriginalPriceUzs, calculatePremiumPriceUzs } from "@/lib/utils";

/**
 * Narxning YAGONA server manbai.
 *
 * ⚠️ Audit P1/P2: oldin buyurtma summasi mijoz brauzerida hisoblanib,
 * anon kalit bilan to'g'ridan-to'g'ri Supabase'ga yozilardi. Click
 * `prepare` esa kelgan summani o'sha mijoz yozgan `total_amount` bilan
 * solishtirardi — ya'ni butun tekshiruv halqasi mijoz qo'lida edi.
 * DevTools'dan `total_amount: 1000` yozib, 800 000 so'mlik atirni
 * 1000 so'mga "to'liq to'langan" qilish mumkin edi.
 *
 * Endi mijozdan FAQAT product_id va miqdor olinadi.
 */

export type DbProduct = {
  id: string;
  title: string;
  price_usd: number;
  product_type: string;
};

export type PricedLine = {
  product_id: string;
  title: string;
  quantity: number;
  price_uzs: number;
  product_type: string;
};

/** Mijozdan keladigan yagona ishonchli ma'lumot. */
export type RequestedItem = { product_id: string; quantity: number };

/** Bitta mahsulotning so'mdagi narxi — turiga qarab. */
export function priceOfProductUzs(p: {
  price_usd: number;
  product_type: string;
}): number {
  return p.product_type === "original"
    ? calculateOriginalPriceUzs(p.price_usd)
    : calculatePremiumPriceUzs(p.price_usd);
}

/**
 * Sof funksiya: so'ralgan qatorlarni baza narxlari bilan to'ldiradi.
 * Mijoz yuborgan `price`, `price_uzs`, `title` kabi maydonlar butunlay
 * e'tiborsiz qoldiriladi — faqat `product_id` va `quantity` o'qiladi.
 */
export function buildOrderLines(
  items: RequestedItem[],
  productsById: Map<string, DbProduct>
): { lines: PricedLine[]; totalUzs: number } {
  if (!items.length) throw new Error("Savat bo'sh");

  const lines: PricedLine[] = [];
  let totalUzs = 0;

  for (const item of items) {
    const p = productsById.get(item.product_id);
    if (!p) throw new Error(`Mahsulot topilmadi: ${item.product_id}`);

    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const price = priceOfProductUzs(p);
    totalUzs += price * qty;

    lines.push({
      product_id: p.id,
      title: p.title,
      quantity: qty,
      price_uzs: price,
      product_type: p.product_type,
    });
  }

  return { lines, totalUzs };
}

/** Bazadan narxlarni olib, buyurtma qatorlarini quradi. */
export async function computeOrderTotal(
  items: RequestedItem[]
): Promise<{ lines: PricedLine[]; totalUzs: number }> {
  if (!items.length) throw new Error("Savat bo'sh");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // RLS yoqilgandan keyin anon kalit bu yerda ishlamaydi.
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const ids = [...new Set(items.map((i) => i.product_id))];
  const { data, error } = await supabase
    .from("products")
    .select("id, title, price_usd, product_type")
    .in("id", ids);

  if (error) throw new Error(`Mahsulot narxlarini olishda xatolik: ${error.message}`);

  const byId = new Map<string, DbProduct>(
    (data || []).map((p) => [p.id as string, p as DbProduct])
  );
  return buildOrderLines(items, byId);
}
