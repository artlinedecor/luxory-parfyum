import { siteConfig } from "@/config/site";
import { getFragranceView } from "@/lib/fragrance";
import { seoProductName, productUrl, slugify } from "@/lib/seo";
import type { Product } from "@/lib/types";

/**
 * Toifa (/toifa/<slug>) va brend (/brend/<slug>) sahifalari uchun ma'lumot.
 *
 * Qoida: faqat bazadagi haqiqiy ma'lumot va docs/HOLAT.md dagi tasdiqlangan
 * va'dalar yoziladi. Narx va aloqa ma'lumoti bu yerda o'zgartirilmaydi.
 * Kalit so'zlar xaritasi: docs/seo-kalitlar.md
 */

const BASE = siteConfig.siteUrl.replace(/\/$/, "");

export interface FaqItem {
  q: string;
  a: string;
}

export { slugify };

// ── Brendlar ─────────────────────────────────────────────────────
export interface BrandGroup {
  slug: string;
  name: string;
  products: Product[];
}

/** Mahsulotlarni brend bo'yicha guruhlaydi (eng ko'p mahsulotlisi birinchi). */
export function groupBrands(products: Product[]): BrandGroup[] {
  const map = new Map<string, BrandGroup>();
  for (const p of products) {
    const brand = getFragranceView(p).brand;
    if (!brand) continue;
    const slug = slugify(brand);
    if (!slug) continue;
    const g = map.get(slug) ?? { slug, name: brand, products: [] };
    g.products.push(p);
    map.set(slug, g);
  }
  return [...map.values()].sort((a, b) => b.products.length - a.products.length || a.name.localeCompare(b.name));
}

/** Kamida shuncha mahsulotli brend sahifasi indekslanadi (yupqa sahifa bo'lmasin). */
export const BRAND_MIN_INDEX = 2;

export function brandPath(slug: string): string {
  return `/brend/${slug}`;
}

export function brandTitle(name: string): string {
  return `${name} atiri — Toshkentda sotib olish | ${siteConfig.siteName}`;
}

export function brandDescription(name: string, count: number): string {
  return `${name} atirlari Toshkentda: katalogda ${count} ta ${name} atiri. Premium atir 800 000 so'm, 3, 6 yoki 12 oyga bo'lib to'lash (Uzum Nasiya). Tez yetkazib berish.`;
}

export function brandIntro(name: string, count: number): string[] {
  return [
    `${name} atirlari ${siteConfig.siteName} do'konida: hozir katalogda ${count} ta ${name} atiri bor. Har bir atir sahifasida nomi, hajmi va (ma'lumot bo'lsa) notalari ko'rsatilgan.`,
    `Toshkentda ${name} atirini onlayn tanlang va 3, 6 yoki 12 oyga bo'lib to'lab oling. Premium atirlar uchun narx bitta — 800 000 so'm; original atirlar narxi har bir atir sahifasida yozilgan.`,
  ];
}

export function brandFaq(name: string): FaqItem[] {
  return [
    {
      q: `${name} atirini Toshkentda qayerdan sotib olsa bo'ladi?`,
      a: `${siteConfig.siteName} onlayn do'konida ${name} atirlari katalogi bor. Atirni tanlab, savatga qo'shing va buyurtma bering. Tez yetkazib beramiz.`,
    },
    {
      q: `${name} atirini bo'lib to'lab olsa bo'ladimi?`,
      a: `Ha. Uzum Nasiya orqali 3, 6 yoki 12 oyga bo'lib to'lash mumkin: karta va naqd pul shart emas, telefon raqam va SMS-kod yetarli.`,
    },
    {
      q: `${name} atirlari qancha turadi?`,
      a: `Premium atirlar narxi bitta — 800 000 so'm. Original atirlar narxi har bir atir sahifasida ko'rsatilgan.`,
    },
  ];
}

// ── Toifalar ─────────────────────────────────────────────────────
export interface Category {
  slug: string;
  /** H1 va breadcrumb nomi */
  name: string;
  title: string;
  description: string;
  intro: string[];
  faq: FaqItem[];
  match: (p: Product) => boolean;
}

const PAY_FAQ: FaqItem = {
  q: "Atirni bo'lib to'lab olsa bo'ladimi?",
  a: "Ha. Uzum Nasiya orqali 3, 6 yoki 12 oyga bo'lib to'lash mumkin: karta va naqd pul shart emas, telefon raqam va SMS-kod yetarli (taxminan 2 daqiqa).",
};
const PRICE_FAQ: FaqItem = {
  q: "Atirlar qancha turadi?",
  a: "Premium atirlar narxi bitta — 800 000 so'm. Original atirlar narxi har bir atir sahifasida ko'rsatilgan.",
};
const DELIVERY_FAQ: FaqItem = {
  q: "Toshkentga yetkazib berasizmi?",
  a: "Ha, tez yetkazib berish xizmati bor.",
};

export const CATEGORIES: Category[] = [
  {
    slug: "erkaklar-atiri",
    name: "Erkaklar atiri",
    title: `Erkaklar atiri Toshkentda — original va premium | ${siteConfig.siteName}`,
    description:
      "Erkaklar atirlari katalogi: Dior, Chanel, Tom Ford va boshqa brendlar. Premium atir 800 000 so'm, 3, 6 yoki 12 oyga bo'lib to'lash. Toshkentga tez yetkazib berish.",
    intro: [
      "Erkaklar uchun atirlar katalogi. Har bir atir sahifasida hajmi va notalari (ma'lumot bo'lsa) ko'rsatilgan.",
      "Toshkentda erkaklar atirini onlayn tanlang va 3, 6 yoki 12 oyga bo'lib to'lab oling. Ayollar uchun atirlarni ham ko'ring: pastdagi havolalar orqali.",
    ],
    faq: [
      { q: "Erkaklar uchun qaysi atirni tanlash kerak?", a: "Atir sahifasidagi notalar va hid oilasiga qarang. Savol bo'lsa, Telegram orqali yozing." },
      PRICE_FAQ,
      PAY_FAQ,
      DELIVERY_FAQ,
    ],
    match: (p) => p.gender === "male",
  },
  {
    slug: "ayollar-atiri",
    name: "Ayollar atiri",
    title: `Ayollar atiri Toshkentda — original va premium | ${siteConfig.siteName}`,
    description:
      "Ayollar atirlari katalogi: Dior, Chanel, YSL va boshqa brendlar. Premium atir 800 000 so'm, 3, 6 yoki 12 oyga bo'lib to'lash. Toshkentga tez yetkazib berish.",
    intro: [
      "Ayollar uchun atirlar katalogi. Har bir atir sahifasida hajmi va notalari (ma'lumot bo'lsa) ko'rsatilgan.",
      "Toshkentda ayollar atirini onlayn tanlang va 3, 6 yoki 12 oyga bo'lib to'lab oling. Erkaklar atirlari ham katalogda bor.",
    ],
    faq: [
      { q: "Ayollar uchun qaysi atirni tanlash kerak?", a: "Atir sahifasidagi notalar va hid oilasiga qarang. Savol bo'lsa, Telegram orqali yozing." },
      PRICE_FAQ,
      PAY_FAQ,
      DELIVERY_FAQ,
    ],
    match: (p) => p.gender === "female",
  },
  {
    slug: "unisex-atirlar",
    name: "Unisex atirlar",
    title: `Unisex atirlar — erkak va ayol uchun | ${siteConfig.siteName}`,
    description:
      "Unisex atirlar: erkaklar ham, ayollar ham ishlata oladigan hidlar. Premium atir 800 000 so'm, 3, 6 yoki 12 oyga bo'lib to'lash. Toshkentga tez yetkazib berish.",
    intro: [
      "Unisex atirlar — erkaklar ham, ayollar ham ishlatadigan hidlar. Har bir atir sahifasida hajmi va notalari (ma'lumot bo'lsa) ko'rsatilgan.",
      "Toshkentda unisex atirni onlayn tanlang va 3, 6 yoki 12 oyga bo'lib to'lab oling.",
    ],
    faq: [PRICE_FAQ, PAY_FAQ, DELIVERY_FAQ],
    match: (p) => (p.gender ?? "unisex") === "unisex",
  },
  {
    slug: "original-atirlar",
    name: "Original atirlar",
    title: `Original atirlar Toshkentda — sotib olish | ${siteConfig.siteName}`,
    description:
      "Original atirlar Toshkentda: brend atirlari katalogi, narxi har bir atir sahifasida. 3, 6 yoki 12 oyga bo'lib to'lash (Uzum Nasiya). Tez yetkazib berish.",
    intro: [
      "Original atirlar bo'limida brend atirlari to'plangan. Har bir original atirning narxi uning o'z sahifasida ko'rsatilgan.",
      "Toshkentda original atirni onlayn tanlang va 3, 6 yoki 12 oyga bo'lib to'lab oling.",
    ],
    faq: [
      { q: "Original atir narxi qancha?", a: "Original atirlar narxi atirga qarab farq qiladi va har bir atir sahifasida yozilgan." },
      PAY_FAQ,
      DELIVERY_FAQ,
    ],
    match: (p) => p.product_type === "original",
  },
  {
    slug: "premium-atirlar",
    name: "Premium atirlar — 800 000 so'm",
    title: `Premium atirlar 800 000 so'm — bo'lib to'lash | ${siteConfig.siteName}`,
    description:
      "Premium atirlar: har biri 800 000 so'm (bitta narx). 3, 6 yoki 12 oyga bo'lib to'lash, hozir 0 so'm. Toshkentga tez yetkazib berish.",
    intro: [
      "Premium atirlar bo'limida har qanday atirning narxi bitta — 800 000 so'm.",
      "Bo'lib to'lash: Uzum Nasiya orqali 3, 6 yoki 12 oyga, hozir 0 so'm.",
    ],
    faq: [PRICE_FAQ, PAY_FAQ, DELIVERY_FAQ],
    match: (p) => p.product_type !== "original",
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryPath(slug: string): string {
  return `/toifa/${slug}`;
}

// ── JSON-LD ──────────────────────────────────────────────────────
export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${BASE}${t.path}`,
    })),
  };
}

export function itemListJsonLd(name: string, path: string, products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: `${BASE}${path}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 50).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: productUrl(p),
        name: seoProductName(p),
      })),
    },
  };
}
