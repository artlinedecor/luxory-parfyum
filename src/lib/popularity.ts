import { findShortLinkProduct, type SearchableProduct } from "@/lib/product-match";

/**
 * Katalog tartibi: dunyoda eng mashhur atirlar birinchi (egasi talabi).
 * Nomlar /a/ qisqa havolasi bilan bir xil — findShortLinkProduct moslaydi,
 * shuning uchun mahsulot id'si yoki nomi o'zgarsa ham ro'yxat buzilmaydi.
 * Tartibni o'zgartirish uchun shu ro'yxatni tahrirlash kifoya.
 */
export const POPULAR_SLUGS = [
  "dior-sauvage-edp",
  "bleu-de-chanel-parfum",
  "mfk-baccarat-rouge-540",
  "creed-aventus",
  "bvlgari-tygar",
  "lv-imagination",
  "tom-ford-tobacco-vanille",
  "ysl-black-opium",
  "miss-dior",
  "coco-mademoiselle-chanel",
  "dior-jadore",
  "chanel-allure",
  "pdm-delina",
  "pdm-layton",
  "versace-eros",
  "paco-rabanne-invictus",
  "paco-rabanne-million",
  "jean-paul-gaultier-le-male",
  "lancome-la-vie-est-belle",
  "carolina-herrera-good-girl",
  "ysl-libre",
  "giorgio-armani-acqua-di-gio",
  "dolce-gabbana-light-blue",
  "le-labo-santal-33",
  "tom-ford-oud-wood",
  "tom-ford-lost-cherry",
  "xerjoff-erba-pura",
  "kilian-angels-share",
  "kilian-good-girl-gone-bad",
  "amouage-guidance",
  "kayali-vanilla-28",
  "maison-margiela-by-the-fireplace",
  "initio-side-effect",
  "nishane-hacivat",
  "dior-sauvage-elixir",
  "versace-crystal-noir",
  "giorgio-armani-si",
  "armani-stronger-with-you",
  "valentino-donna-born-in-roma",
  "dior-homme-intense",
];

/**
 * Mashhurlar ro'yxat tartibida birinchi, qolganlari avvalgi tartibida
 * (omborda borlari oldin — so'rov shunday qaytaradi). Barqaror saralash.
 */
export function sortByPopularity<T extends SearchableProduct>(products: T[], slugs: string[] = POPULAR_SLUGS): T[] {
  const rank = new Map<string, number>();
  slugs.forEach((slug, i) => {
    const p = findShortLinkProduct(products, slug);
    if (p && !rank.has(p.id)) rank.set(p.id, i);
  });
  return products
    .map((p, i) => ({ p, i, r: rank.get(p.id) ?? Infinity }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.p);
}
