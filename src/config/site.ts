/**
 * White-Label Configuration
 * ─────────────────────────
 * Saytni boshqa brendga sotganda FAQAT shu faylni o'zgartirish kifoya.
 * Barcha nom, logo, kontakt va Telegram linklari shu yerdan olinadi.
 */
export const siteConfig = {
  // ── Brend ────────────────────────────────────────
  siteName: "Elore Parfume",
  siteDescription: "Premium parfyumeriya — original va premium atirlar do'koni",
  siteUrl: "https://parfumelux.uz",
  logoInitial: "E",        // Rasm yuklanmasa ko'rinadigan harf
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
  // Havola ulashilganda (Instagram DM, Telegram) chiqadigan rasm, 1200×630.
  // Sahifadagi `openGraph` layout'nikini to'liq almashtiradi, shuning uchun
  // har sahifa buni o'zi qo'shishi kerak. Rasm almashsa fayl NOMINI ham
  // almashtiring — Instagram eski URL'ni keshlab qoladi.
  ogImage: {
    url: "/og-elore.jpg",
    width: 1200,
    height: 630,
    alt: "Elore Parfume — sevimli atiringizni saytimizdan tanlang",
  },
  seoTitle: "Elore Parfume — Toshkentda Original va Premium Atirlar, 12 oyga bo'lib to'lash",
  seoDescription:
    "Toshkentda original va premium atirlar: Tom Ford, Chanel, Dior, Creed va boshqa brendlar. Premium atir — 800 000 so'm, 3, 6 yoki 12 oyga bo'lib to'lash (Uzum Nasiya). Tez yetkazib berish.",
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
