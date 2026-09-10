/**
 * White-Label Configuration
 * ─────────────────────────
 * Saytni boshqa brendga sotganda FAQAT shu faylni o'zgartirish kifoya.
 * Barcha nom, logo, kontakt va Telegram linklari shu yerdan olinadi.
 */
export const siteConfig = {
  // ── Brend ────────────────────────────────────────
  siteName: "Parfume Lux (Elore)",
  siteDescription: "Premium parfyumeriya — Original va Super Klon atirlar do'koni",
  siteUrl: "https://parfumelux.uz",
  logoInitial: "P",        // Rasm yuklanmasa ko'rinadigan harf
  // Logotip loyiha ichida — sozlamalardagi havola faqat qo'shimcha.
  // Ilgari u faqat admin brauzerining localStorage'ida turardi va
  // mijozlarga umuman ko'rinmasdi.
  logoMark: "/logo-mark.webp",  // Header uchun emblema
  logoFull: "/logo.webp",       // To'liq lockup (footer, ulashish)

  // ── Kontakt ──────────────────────────────────────
  phone: "+998 99 262 01 01",
  location: "Toshkent, O'zbekiston",

  // ── Telegram ─────────────────────────────────────
  telegramAdmin: "https://t.me/Jelyor",        // Admin lichka (Checkout xabar shu yerga boradi)
  telegramAdminUsername: "https://t.me/Jelyor",  // Admin lichka link
  telegramChannel: "https://t.me/eloreparfum", // Kanal

  // ── To'lov ───────────────────────────────────────
  paymentCard: "5614 6821 1469 4302",
  paymentCardHolder: "Jalalov Elyorbek",
  depositAmount: 605000, // Original atirlar uchun zaklad summasi (UZS)

  // ── SEO ──────────────────────────────────────────
  seoTitle: "Parfume Lux (Elore) — Toshkentda Original Atirlar va Super Klon Parfyumeriya",
  seoDescription:
    "Toshkentda 100% original va premium super klon atirlar do'koni. Tom Ford, Chanel, Dior, Creed va boshqa jahon brendlari. 0-0-6 muddatli to'lov va O'zbekiston bo'ylab tez yetkazib berish.",
  seoKeywords: [
    "Parfume Lux",
    "parfume lux",
    "parfumelux.uz",
    "Elore Parfume",
    "elore parfume",
    "элор парфюм",
    "парфюм люкс",
    "atir",
    "atirlar",
    "parfyumeriya",
    "parfyum",
    "Toshkent",
    "original atir",
    "original atirlar toshkent",
    "super klon",
    "super clone",
    "atir do'koni",
    "duxi toshkent",
    "духи ташкент",
    "купить духи в ташкенте",
    "парфюмерия ташкент",
    "оригинальные духи",
    "atir narxlari",
  ],
} as const;

export type SiteConfig = typeof siteConfig;
