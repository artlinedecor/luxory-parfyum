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
  seoTitle: "Lux Atir — Premium Parfyumeriya",
  seoDescription:
    "Original va Super Klon atirlar. Toshkentda eng sifatli parfyumeriya do'koni. Yetkazib berish bor.",
  seoKeywords: [
    "atir",
    "parfyumeriya",
    "Toshkent",
    "original atir",
    "super klon",
    "super clone",
    "parfum",
  ],
} as const;

export type SiteConfig = typeof siteConfig;
