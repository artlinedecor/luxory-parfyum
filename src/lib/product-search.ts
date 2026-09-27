import { priceOfProductUzs } from "@/lib/pricing-server";
import { formatUzs } from "@/lib/utils";
import type { SearchableProduct } from "@/lib/product-match";

// Qidiruv mantig'i product-match.ts da (server kodisiz, brauzerda ham ishlaydi).
export { normalizeQuery, searchProducts, findShortLinkProduct } from "@/lib/product-match";
export type { SearchableProduct } from "@/lib/product-match";

export type PublicProductRow = SearchableProduct & {
  price_usd: number;
  product_type: string;
  volume_ml?: number | null;
  image_url?: string | null;
};

export type PublicItem = {
  title: string;
  brand: string | null;
  volume_ml: number | null;
  type: "original" | "klon";
  price_uzs: number;
  price_text: string;
  installment_text: string;
  in_stock: boolean;
  availability_text: string;
  url: string;
  image: string | null;
};

export function toPublicItem(p: PublicProductRow, siteUrl: string): PublicItem {
  const price = priceOfProductUzs(p);
  const inStock = (p.stock ?? 0) > 0;
  return {
    title: p.title,
    brand: p.brand ?? null,
    volume_ml: p.volume_ml ?? null,
    type: p.product_type === "original" ? "original" : "klon",
    price_uzs: price,
    price_text: `${formatUzs(price)} so'm`,
    installment_text: "3, 6 yoki 12 oyga bo'lib to'lash (Uzum Nasiya)",
    in_stock: inStock,
    availability_text: inStock ? "Omborda bor" : "Buyurtma bilan · 3 kungacha",
    url: `${siteUrl.replace(/\/$/, "")}/catalog/${p.id}?utm_source=chatplace&utm_medium=bot`,
    image: p.image_url ?? null,
  };
}

/** Bot to'g'ridan-to'g'ri yuborishi mumkin bo'lgan tayyor matn. */
export function buildReply(items: PublicItem[], q: string): string {
  if (!items.length) {
    return `"${q.trim()}" katalogimizda topilmadi. O'xshash hidli atirlarni tavsiya qilishimni xohlaysizmi?`;
  }
  const lines = items.map((it) => {
    const name = [it.brand, it.title].filter(Boolean).join(" ");
    return `• ${name} — ${it.price_text}\n${it.url}`;
  });
  return `${lines.join("\n\n")}\n\n3, 6 yoki 12 oyga bo'lib to'lash mumkin — havolani bosing, 2 daqiqada rasmiylashtiriladi.`;
}
