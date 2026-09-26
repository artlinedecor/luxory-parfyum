import { siteConfig } from "@/config/site";
import { getFragranceView, CONCENTRATION_SHORT } from "@/lib/fragrance";
import { priceOfProductUzs } from "@/lib/pricing-server";
import { formatUzs } from "@/lib/utils";
import type { Product } from "@/lib/types";

/**
 * Qidiruv tizimlari (Google, Yandex) va AI yordamchilar uchun atir ma'lumoti.
 *
 * ⚠️ Oldin schema'da `price: product.price_usd, priceCurrency: "USD"` edi —
 * Google 800 000 so'mlik atirni "3.31 dollar" deb ko'rardi. Narx endi
 * savat va to'lov bilan bir xil manbadan (priceOfProductUzs) olinadi.
 */

// Katta harf bilan qolishi kerak bo'lgan qisqartmalar
const KEEP_UPPER = new Set(["EDP", "EDT", "EDC", "II", "III", "IV", "MFK", "YSL", "CK", "HFC", "LV", "XJ", "BR", "NYC"]);

/** "BOSS THE SCENT" → "Boss The Scent"; aralash yozilgan nom o'zgarmaydi. */
export function tidyCase(s: string): string {
  if (/\p{Ll}/u.test(s)) return s;
  return s
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((w) => (KEEP_UPPER.has(w.toUpperCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join("");
}

// Nomda qolib ketadigan brend qisqartmalari ("YSL Y 100ML" → "Y")
const BRAND_SHORT: Record<string, string[]> = { "Yves Saint Laurent": ["YSL"] };

const escapeRe = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Nomdan hajm va boshidagi brendni olib tashlaydi. parseFragranceName qisqa nomlarda
 * ("PANTHEON ROMA M 100ML") butun nomni qaytaradi — shunda "Pantheon Roma Pantheon Roma M 100ml 100 ml"
 * bo'lib chiqardi.
 */
function cleanName(raw: string, brand: string | null): string {
  let n = tidyCase(raw).replace(/(^|\s)\d{1,3}\s*(?:ml|мл)(?=\s|$)/giu, "$1").replace(/\s{2,}/g, " ").trim();
  if (brand) {
    for (const b of [brand, ...(BRAND_SHORT[brand] ?? [])]) {
      const stripped = n.replace(new RegExp(`^${escapeRe(b)}\\s+`, "iu"), "");
      if (stripped.length >= 1 && stripped !== n) { n = stripped; break; }
    }
  }
  return n || tidyCase(raw);
}

/** "Hugo Boss Boss The Scent EDT 100 ml" — qidiruvda ko'rinadigan toza nom. */
export function seoProductName(product: Product): string {
  const f = getFragranceView(product);
  const name = cleanName(f.name, f.brand);
  const parts = [f.brand, name];
  const conc = f.concentration ? CONCENTRATION_SHORT[f.concentration] : null;
  if (conc && !name.toLowerCase().includes(conc.toLowerCase())) parts.push(conc);
  if (f.volumeMl) parts.push(`${f.volumeMl} ml`);
  return parts.filter(Boolean).join(" ").replace(/\s{2,}/g, " ").trim();
}

export function productTypeLabel(product: Pick<Product, "product_type">): string {
  return product.product_type === "original" ? "Original" : "Premium klon";
}

export function productPriceUzs(product: Pick<Product, "price_usd" | "product_type">): number {
  return priceOfProductUzs({ price_usd: product.price_usd, product_type: product.product_type ?? "lux_copy" });
}

export function productUrl(product: Pick<Product, "id">): string {
  return `${siteConfig.siteUrl}/catalog/${product.id}`;
}

/** Faqat tasdiqlangan va'dalar (docs/HOLAT.md "Egasi qarorlari"). */
export function productMetaDescription(product: Product): string {
  const f = getFragranceView(product);
  const price = formatUzs(productPriceUzs(product)).replace(/ /g, " ");
  const notes = f.notes ? [...f.notes.top, ...f.notes.heart, ...f.notes.base].slice(0, 4) : [];
  const lead = `${seoProductName(product)} — ${productTypeLabel(product).toLowerCase()} atir, ${price} so'm.`;
  const pay = " 3, 6 yoki 12 oyga bo'lib to'lash (Uzum Nasiya). Tez yetkazib berish, Toshkent.";
  const notesPart = notes.length ? ` Notalar: ${notes.join(", ")}.` : "";
  return (lead + notesPart + pay).slice(0, 300);
}

export function productJsonLd(product: Product) {
  const f = getFragranceView(product);
  const url = productUrl(product);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: seoProductName(product),
    image: product.image_url || `${siteConfig.siteUrl}/products/default.png`,
    description: product.description || productMetaDescription(product),
    sku: product.id,
    url,
    ...(f.brand ? { brand: { "@type": "Brand", name: f.brand } } : {}),
    category: "Atir",
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "UZS",
      price: productPriceUzs(product),
      itemCondition: "https://schema.org/NewCondition",
      availability: product.is_available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: siteConfig.siteName, url: siteConfig.siteUrl },
    },
  };
}

export function productBreadcrumbJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Bosh sahifa", item: siteConfig.siteUrl },
      { "@type": "ListItem", position: 2, name: "Katalog", item: `${siteConfig.siteUrl}/catalog` },
      { "@type": "ListItem", position: 3, name: seoProductName(product), item: productUrl(product) },
    ],
  };
}
