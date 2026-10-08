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

/** Mijozga ko'rinadigan tur: "klon" so'zi ishlatilmaydi (egasi, 2026-09-27) */
export function productTypeLabel(product: Pick<Product, "product_type">): string {
  return product.product_type === "original" ? "Original atir" : "Premium atir";
}

export function productPriceUzs(product: Pick<Product, "price_usd" | "product_type">): number {
  return priceOfProductUzs({ price_usd: product.price_usd, product_type: product.product_type ?? "lux_copy" });
}

export function productUrl(product: Pick<Product, "id">): string {
  return `${siteConfig.siteUrl}/catalog/${product.id}`;
}

/** Google/Yandex qidiruv natijasida kesilmaydigan chegaralar. */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;

/**
 * Mahsulot sahifasi sarlavhasi. Avval har doim
 * "<nom> — <tur>, bo'lib to'lash | <do'kon>" edi va ko'p atirlarda
 * 60 belgidan oshib, qidiruvda kesilardi. Endi sig'adigan eng to'liq
 * variant tanlanadi.
 */
export function productTitle(product: Product): string {
  const name = seoProductName(product);
  const type = productTypeLabel(product);
  const variants = [
    `${name} — ${type}, bo'lib to'lash | ${siteConfig.siteName}`,
    `${name} — ${type} | ${siteConfig.siteName}`,
    `${name} — ${type}, bo'lib to'lash`,
    `${name} — ${type}`,
  ];
  return variants.find((v) => v.length <= TITLE_MAX) ?? variants[variants.length - 1];
}

/**
 * Faqat tasdiqlangan va'dalar (docs/HOLAT.md "Egasi qarorlari").
 * 160 belgidan oshmaydi: notalar faqat joy qolsa qo'shiladi — narx va
 * bo'lib to'lash matni kesilmaydi (avval 300 gacha kesilardi).
 */
export function productMetaDescription(product: Product): string {
  const f = getFragranceView(product);
  const price = formatUzs(productPriceUzs(product)).replace(/\u00a0/g, " ");
  const notes = f.notes ? [...f.notes.top, ...f.notes.heart, ...f.notes.base].slice(0, 4) : [];
  const lead = `${seoProductName(product)} — ${productTypeLabel(product).toLowerCase()}, ${price} so'm.`;
  const pay = " 3, 6 yoki 12 oyga bo'lib to'lash (Uzum Nasiya). Tez yetkazib berish, Toshkent.";
  for (let n = notes.length; n > 0; n--) {
    const withNotes = `${lead} Notalar: ${notes.slice(0, n).join(", ")}.${pay}`;
    if (withNotes.length <= DESCRIPTION_MAX) return withNotes;
  }
  const plain = lead + pay;
  if (plain.length <= DESCRIPTION_MAX) return plain;
  // Juda uzun nomli atir: so'z chegarasida kesiladi
  const cut = plain.slice(0, DESCRIPTION_MAX - 1);
  const space = cut.lastIndexOf(" ");
  return `${space > 0 ? cut.slice(0, space) : cut}…`;
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
      // Bo'lib to'lash - do'konning asosiy ustunligi, lekin u sxemada
      // umuman yo'q edi: faqat sahifa matnida va tavsif satrida turardi.
      // Matnni o'qiydigan AI uni ko'rardi, sxemani o'qiydigan tizimlar
      // (masalan savdo yo'naltirilgan javob motorlari) esa ko'rmasdi.
      acceptedPaymentMethod: [
        { "@type": "PaymentMethod", name: "Uzum Nasiya — 3, 6 yoki 12 oyga bo'lib to'lash" },
        { "@type": "PaymentMethod", name: "Naqd pul" },
        { "@type": "PaymentMethod", name: "Uzcard / Humo" },
      ],
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Bo'lib to'lash",
        value: "3, 6 yoki 12 oy — Uzum Nasiya, karta shart emas, telefon + SMS",
      },
    ],
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
