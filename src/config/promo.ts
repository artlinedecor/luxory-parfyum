/**
 * Oktyabr aksiyasi — FAQAT ko'rinish (egasi, 2026-09-27).
 * ──────────────────────────────────────────────────────
 * Haqiqiy narx o'zgarmaydi: premium atir 800 000 so'm (priceOfProductUzs,
 * savat, Uzum Nasiya, Click — hammasi o'sha). Bu yerda faqat kartochka va
 * sahifada chizilgan "1 000 000" va "−20%" ko'rsatish qoidasi turadi.
 *
 * - `endsAt` o'tgach hamma aksiya elementlari o'zi yo'qoladi (server va
 *   client bir xil `isPromoActive` bilan tekshiradi).
 * - Muddatidan oldin o'chirish: `active: false`.
 * - SEO/JSON-LD'ga eski narx QO'SHILMAYDI (src/lib/seo.ts) — soxta chegirma
 *   uchun Google jazolashi mumkin.
 */
export const PROMO = {
  active: true,
  endsAt: "2026-10-31T23:59:59+05:00",
  /** Chizilgan "eski" narx */
  oldPriceUzs: 1_000_000,
  percent: 20,
  /** Aksiya faqat shu narxdagi atirlarga (premium, 800 000) ko'rinadi */
  priceUzs: 800_000,
} as const;

export type PromoConfig = {
  active: boolean;
  endsAt: string;
  oldPriceUzs: number;
  percent: number;
  priceUzs: number;
};

const DAY_MS = 86_400_000;
/** Toshkent vaqti (UTC+5, yozgi vaqt yo'q) */
const TASHKENT_OFFSET_MS = 5 * 3_600_000;

export function isPromoActive(now: number, promo: PromoConfig = PROMO): boolean {
  if (!promo.active) return false;
  const end = Date.parse(promo.endsAt);
  return Number.isFinite(end) && now <= end;
}

/**
 * Kartochkada chizilgan eski narx: aksiya faol (`active` — usePromoActive()
 * yoki isPromoActive(now) natijasi) va atir aynan aksiya
 * narxida (800 000) bo'lsa — eski narx, aks holda null (original atirlar,
 * test narxlar, aksiya tugagan).
 */
export function promoOldPriceFor(
  priceUzs: number,
  active: boolean,
  promo: PromoConfig = PROMO
): number | null {
  if (!active) return null;
  return priceUzs === promo.priceUzs ? promo.oldPriceUzs : null;
}

/**
 * Tugashigacha qolgan kalendar kunlari, Toshkent vaqtida: oxirgi kuni 1,
 * undan oldingi kuni 2 va h.k. Aksiya nofaol bo'lsa — 0.
 */
export function promoDaysLeft(now: number, promo: PromoConfig = PROMO): number {
  if (!isPromoActive(now, promo)) return 0;
  const end = Date.parse(promo.endsAt);
  const dayOf = (t: number) => Math.floor((t + TASHKENT_OFFSET_MS) / DAY_MS);
  return dayOf(end) - dayOf(now) + 1;
}

const MONTHS_UZ = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
const MONTHS_RU = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

/** "31-oktyabrgacha" / "до 31 октября" — endsAt'dan, Toshkent vaqtida */
export function promoEndLabel(lang: "uz" | "ru", promo: PromoConfig = PROMO): string {
  const d = new Date(Date.parse(promo.endsAt) + TASHKENT_OFFSET_MS);
  const day = d.getUTCDate();
  const m = d.getUTCMonth();
  return lang === "ru" ? `до ${day} ${MONTHS_RU[m]}` : `${day}-${MONTHS_UZ[m]}gacha`;
}

export type PromoCountdown = {
  days: number;
  hours: number;
  minutes: number;
};

const MINUTE_MS = 60_000;

/**
 * Tugashigacha qolgan butun daqiqalar (yuqoriga yaxlitlangan: 30 soniya
 * qolganda ham "1 daqiqa" — aksiya hali faol turganda "00" ko'rinmasin).
 * Aksiya nofaol bo'lsa — null.
 */
export function promoMinutesLeft(now: number, promo: PromoConfig = PROMO): number | null {
  if (!isPromoActive(now, promo)) return null;
  return Math.ceil((Date.parse(promo.endsAt) - now) / MINUTE_MS);
}

/** Qolgan daqiqalarni kun · soat · daqiqaga bo'ladi. */
export function splitMinutes(totalMinutes: number): PromoCountdown {
  const m = Math.max(0, Math.floor(totalMinutes));
  return {
    days: Math.floor(m / 1440),
    hours: Math.floor((m % 1440) / 60),
    minutes: m % 60,
  };
}

/** Keyingi daqiqa o'zgarishigacha ms — countdown taymeri shunga tekislanadi. */
export function msToNextMinuteTick(now: number, promo: PromoConfig = PROMO): number {
  const left = Date.parse(promo.endsAt) - now;
  if (!Number.isFinite(left) || left <= 0) return MINUTE_MS;
  const rest = left % MINUTE_MS;
  return rest === 0 ? MINUTE_MS : rest;
}
