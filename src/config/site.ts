/**
 * White-Label Configuration
 * ─────────────────────────
 * Saytni boshqa brendga sotganda FAQAT shu faylni o'zgartirish kifoya.
 * Barcha nom, logo, kontakt va Telegram linklari shu yerdan olinadi.
 */
export const siteConfig = {
  // ── Brend ────────────────────────────────────────
  siteName: "Lux Atir",
  siteDescription: "Premium parfyumeriya — Original va Super Klon atirlar",
  siteUrl: "https://parfumelux.uz",
  logoInitial: "L",        // Logo ichidagi harf
  // logoUrl: "/logo.png",  // Kelajakda rasm logo qo'shish mumkin

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
  depositAmount: 50, // Original atirlar uchun zaklad summasi ($)

  // ── SEO ──────────────────────────────────────────
  seoTitle: "Lux Atir — Toshkentda Original Atirlar va Super Klon Parfyumeriya Do'koni",
  seoDescription:
    "Premium original va eng sifatli super klon atirlarni hamyonbop narxlarda sotib oling. Toshkent va O'zbekiston bo'ylab tez yetkazib berish. Dior, Chanel, Tom Ford va boshqa brendlar.",
  seoKeywords: [
    "atir",
    "atirlar",
    "parfyumeriya",
    "parfyum",
    "Toshkent",
    "original atir",
    "original atirlar",
    "super klon",
    "super clone",
    "atir do'koni",
    "duxi toshkent",
    "духи ташкент",
    "купить духи",
    "парфюмерия ташкент",
    "оригинальные духи",
    "atir narxlari",
  ],
} as const;

export type SiteConfig = typeof siteConfig;
