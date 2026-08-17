/**
 * Parfyumeriya ma'lumot qatlami.
 *
 * Bazada hozircha brend / hajm / konsentratsiya uchun alohida ustun YO'Q —
 * ular mahsulot nomi ichida yashiringan ("Creed Absolu Aventus 100 ml").
 * Shu sabab bu yerda nomdan ajratib olamiz. Bazaga haqiqiy ustunlar
 * qo'shilgach (migrations/002_fragrance_fields.sql) mahsulotdagi qiymat
 * ustunlik qiladi, parser esa faqat zaxira bo'lib qoladi.
 *
 * MUHIM: hech qanday qiymat "o'ylab topilmaydi". Ma'lumot bo'lmasa
 * null qaytadi va UI o'sha blokni umuman chizmaydi — mijozga soxta
 * nota/akkord ko'rsatilmaydi.
 */

import type { Product } from "./types";

// ── Konsentratsiya ────────────────────────────────────────────────
export type Concentration =
  | "extrait"
  | "edp"
  | "edt"
  | "edc"
  | "elixir"
  | "cologne";

export const CONCENTRATION_LABEL: Record<Concentration, string> = {
  extrait: "Extrait de Parfum",
  elixir: "Elixir",
  edp: "Eau de Parfum",
  edt: "Eau de Toilette",
  edc: "Eau de Cologne",
  cologne: "Cologne",
};

/** Nomdagi yozuvlardan konsentratsiyani aniqlaydi. Topilmasa — null. */
export function parseConcentration(title: string): Concentration | null {
  const t = title.toLowerCase();
  if (/\bextrait\b|\bparfum extrait\b|\bpure parfum\b/.test(t)) return "extrait";
  if (/\belixir\b/.test(t)) return "elixir";
  if (/\bedp\b|eau de parfum/.test(t)) return "edp";
  if (/\bedt\b|eau de toilette/.test(t)) return "edt";
  if (/\bedc\b|eau de cologne/.test(t)) return "edc";
  if (/\bcologne\b/.test(t)) return "cologne";
  // "... Parfum" (Eau de siz) — masalan "Bleu de Chanel Parfum"
  if (/\bparfum\b/.test(t)) return "extrait";
  return null;
}

// ── Hajm ──────────────────────────────────────────────────────────
/** Nomdan "100 ml" / "50ml" ni ajratadi. Topilmasa — null. */
export function parseVolumeMl(title: string): number | null {
  const m = title.match(/(\d{1,3})\s*(?:ml|мл)\b/i);
  if (!m) return null;
  const ml = parseInt(m[1], 10);
  return ml > 0 && ml <= 500 ? ml : null;
}

/** "100 ml / 3.4 fl.oz" ko'rinishida formatlaydi. */
export function formatVolume(ml: number): string {
  const oz = (ml * 0.033814).toFixed(1).replace(/\.0$/, "");
  return `${ml} ml / ${oz} fl.oz`;
}

// ── Brend ─────────────────────────────────────────────────────────
/**
 * Tanilgan brendlar. Uzunroq nomlar oldinroq tekshiriladi, aks holda
 * "Maison Francis Kurkdjian" ni "Maison" deb kesib yuborardik.
 */
const BRANDS = [
  "Boadicea the Victorious",
  "Histoires de Parfums",
  "Vilhelm Parfumerie",
  "Matiere Premiere",
  "Essential Parfums",
  "Attar Collection",
  "Milton-Lloyd",
  "Milton Lloyd",
  "The Harmonist",
  "Giorgio Armani",
  "Louis Vuitton",
  "Pantheon Roma",
  "Les Soeurs",
  "Victoria's Secret",
  "Montblanc",
  "Arabesque",
  "Molinard",
  "Clinique",
  "Lacoste",
  "Amouage",
  "Vilhelm",
  "Chase",
  "HFC",
  "MFK",
  "Maison Francis Kurkdjian",
  "Marc-Antoine Barrois",
  "Marc Antoine Barrois",
  "Van Cleef & Arpels",
  "Juliette Has A Gun",
  "Parfums de Marly",
  "Maison Crivelli",
  "Maison Margiela",
  "Escentric Molecules",
  "Comme des Garcons",
  "Jean Paul Gaultier",
  "Carolina Herrera",
  "Narciso Rodriguez",
  "Yves Saint Laurent",
  "Salvatore Ferragamo",
  "Dolce & Gabbana",
  "Dolce and Gabbana",
  "Swiss Arabian",
  "Ard Al Zaafaran",
  "Tiziana Terenzi",
  "Acqua di Parma",
  "Clive Christian",
  "Giardini di Toscana",
  "Frederic Malle",
  "Bottega Veneta",
  "Thierry Mugler",
  "Viktor & Rolf",
  "Al Haramain",
  "Serge Lutens",
  "Issey Miyake",
  "Calvin Klein",
  "Paco Rabanne",
  "Bond No 9",
  "Orto Parisi",
  "Marc Jacobs",
  "Penhaligon's",
  "Penhaligons",
  "Ex Nihilo",
  "Jo Malone",
  "Tom Ford",
  "Hugo Boss",
  "Nasomatto",
  "Le Labo",
  "Diptyque",
  "Zoologist",
  "Trussardi",
  "Boucheron",
  "Burberry",
  "Guerlain",
  "Givenchy",
  "Valentino",
  "Lancome",
  "Amouage",
  "Xerjoff",
  "Nishane",
  "Mancera",
  "Montale",
  "Lattafa",
  "Rasasi",
  "Bvlgari",
  "Versace",
  "Cartier",
  "Hermes",
  "Chanel",
  "Byredo",
  "Initio",
  "Kilian",
  "Armani",
  "Ajmal",
  "Afnan",
  "Azzaro",
  "Creed",
  "Kenzo",
  "Floris",
  "Chloe",
  "Gucci",
  "Prada",
  "Armaf",
  "Roja",
  "Dior",
  "Memo",
  "YSL",
];

/** To'liq nomga yozib qo'yiladigan qisqartmalar. */
const BRAND_ALIASES: Record<string, string> = {
  MFK: "Maison Francis Kurkdjian",
  HFC: "Haute Fragrance Company",
  "Milton Lloyd": "Milton-Lloyd",
  "Boadicea the Victorious": "Boadicea The Victorious",
  YSL: "Yves Saint Laurent",
  "Marc Antoine Barrois": "Marc-Antoine Barrois",
  "Dolce and Gabbana": "Dolce & Gabbana",
  Penhaligons: "Penhaligon's",
};

/** Emoji, ortiqcha belgi va bo'shliqlarni tozalaydi. */
function stripNoise(s: string): string {
  return s
    // emoji va belgilar
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu,
      " "
    )
    .replace(/[|｜]+/g, " ")
    .replace(/\s*[—–-]\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Nomdan brendni topadi. Ro'yxatda bo'lmasa — null. */
export function parseBrand(title: string): string | null {
  const clean = stripNoise(title);
  for (const brand of BRANDS) {
    const re = new RegExp(
      `(^|[^\\p{L}])${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`,
      "iu"
    );
    if (re.test(clean)) return BRAND_ALIASES[brand] ?? brand;
  }
  // "... by Kilian" ko'rinishi
  const by = clean.match(/\bby\s+([\p{Lu}][\p{L}'-]+(?:\s+[\p{Lu}][\p{L}'-]+)?)/u);
  if (by) return by[1];
  return null;
}

/**
 * Atirning o'z nomi — brend, hajm, konsentratsiya va emoji olib
 * tashlangan holda. Hech narsa qolmasa, tozalangan to'liq nom qaytadi.
 */
export function parseFragranceName(title: string, brand?: string | null): string {
  let s = stripNoise(title);
  const b = brand ?? parseBrand(title);

  if (b) {
    // "Good Girl Gone Bad by Kilian" -> "Good Girl Gone Bad"
    s = s.replace(new RegExp(`\\s*\\bby\\s+${b}\\b`, "iu"), "");
    for (const variant of [b, ...Object.keys(BRAND_ALIASES).filter((k) => BRAND_ALIASES[k] === b)]) {
      s = s.replace(
        new RegExp(`(^|[^\\p{L}])${variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "iu"),
        "$1$2"
      );
    }
  }

  s = s
    .replace(/\d{1,3}\s*(?:ml|мл)\b/gi, "")
    .replace(/\b(eau de parfum|eau de toilette|eau de cologne|extrait de parfum|edp|edt|edc)\b/gi, "")
    .replace(/^\s*[—–\-:,]+\s*/, "")
    .replace(/\s*[—–\-:,]+\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return s.length >= 2 ? s : stripNoise(title);
}

// ── Notalar piramidasi va akkordlar ───────────────────────────────
export interface FragranceNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface Accord {
  /** Akkord nomi, masalan "Yog'ochli" */
  name: string;
  /** 0–100 — atir xarakteridagi ulushi */
  strength: number;
}

export type NoteFamily =
  | "woody"
  | "floral"
  | "oriental"
  | "fresh"
  | "gourmand"
  | "citrus"
  | "aquatic"
  | "spicy"
  | "leather";

export const NOTE_FAMILY_LABEL: Record<NoteFamily, { uz: string; ru: string }> = {
  woody: { uz: "Yog'ochli", ru: "Древесные" },
  floral: { uz: "Gulli", ru: "Цветочные" },
  oriental: { uz: "Sharqona", ru: "Восточные" },
  fresh: { uz: "Tetiklantiruvchi", ru: "Свежие" },
  gourmand: { uz: "Shirin", ru: "Гурманские" },
  citrus: { uz: "Sitrusli", ru: "Цитрусовые" },
  aquatic: { uz: "Suvli", ru: "Водные" },
  spicy: { uz: "O'tkir", ru: "Пряные" },
  leather: { uz: "Charmli", ru: "Кожаные" },
};

export type Season = "spring" | "summer" | "autumn" | "winter";
export type TimeOfDay = "day" | "night";

export const SEASON_LABEL: Record<Season, { uz: string; ru: string }> = {
  spring: { uz: "Bahor", ru: "Весна" },
  summer: { uz: "Yoz", ru: "Лето" },
  autumn: { uz: "Kuz", ru: "Осень" },
  winter: { uz: "Qish", ru: "Зима" },
};

export const TIME_LABEL: Record<TimeOfDay, { uz: string; ru: string }> = {
  day: { uz: "Kunduzi", ru: "День" },
  night: { uz: "Kechqurun", ru: "Вечер" },
};

// ── Bitta joydan olinadigan ko'rinish ma'lumoti ───────────────────
export interface FragranceView {
  brand: string | null;
  name: string;
  volumeMl: number | null;
  concentration: Concentration | null;
  concentrationLabel: string | null;
  notes: FragranceNotes | null;
  accords: Accord[] | null;
  families: NoteFamily[];
  seasons: Season[];
  times: TimeOfDay[];
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/**
 * Mahsulotdan kartochka/detal uchun kerakli hamma narsani yig'adi.
 * Bazadagi ustun bo'lsa — o'sha, bo'lmasa nomdan ajratilgani ishlatiladi.
 */
export function getFragranceView(product: Product): FragranceView {
  const title = product.title || "";

  const brand = product.brand?.trim() || parseBrand(title);
  const name = product.fragrance_name?.trim() || parseFragranceName(title, brand);
  const volumeMl = product.volume_ml ?? parseVolumeMl(title);
  const concentration =
    (product.concentration as Concentration | undefined) ?? parseConcentration(title);

  const top = asStringArray(product.notes_top);
  const heart = asStringArray(product.notes_heart);
  const base = asStringArray(product.notes_base);
  const notes = top.length || heart.length || base.length ? { top, heart, base } : null;

  const rawAccords = Array.isArray(product.accords) ? product.accords : [];
  const accords = rawAccords
    .filter(
      (a): a is Accord =>
        !!a && typeof a.name === "string" && typeof a.strength === "number"
    )
    .sort((a, b) => b.strength - a.strength);

  return {
    brand,
    name,
    volumeMl,
    concentration,
    concentrationLabel: concentration ? CONCENTRATION_LABEL[concentration] : null,
    notes,
    accords: accords.length ? accords : null,
    families: (asStringArray(product.note_families) as NoteFamily[]).filter(
      (f) => f in NOTE_FAMILY_LABEL
    ),
    seasons: (asStringArray(product.seasons) as Season[]).filter((s) => s in SEASON_LABEL),
    times: (asStringArray(product.time_of_day) as TimeOfDay[]).filter((t) => t in TIME_LABEL),
  };
}
