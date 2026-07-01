// Meta Advanced Matching uchun ma'lumotlarni normalizatsiya qilish.
// Bu fayl SOF (pure) — window ham, crypto ham ishlatmaydi — shuning uchun
// client (meta-tracker.ts) va server (api/meta-capi/route.ts) ikkalasi ham import qila oladi.

/**
 * Telefon raqamini Meta talab qiladigan formatga keltiradi: faqat raqamlar,
 * xalqaro kod bilan (O'zbekiston uchun 998...), + va bo'sh joylarsiz.
 * Masalan: "+998 90 123 45 67" -> "998901234567"
 */
export function normalizePhone(raw?: string | null): string {
  if (!raw) return "";
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  // Boshidagi nollarni olib tashlash (masalan 0998... yoki 090...)
  digits = digits.replace(/^0+/, "");
  // O'zbekiston mahalliy mobil raqami (9 xonali, masalan 901234567) -> 998 qo'shamiz
  if (digits.length === 9) {
    digits = "998" + digits;
  }
  return digits;
}

/**
 * To'liq ismni fn (birinchi) va ln (qolgan) ga ajratadi, kichik harflarga o'giradi.
 * Meta fn/ln ni alohida, kichik harfda kutadi.
 */
export function splitName(raw?: string | null): { first: string; last: string } {
  if (!raw) return { first: "", last: "" };
  const parts = String(raw).trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  const first = parts[0];
  const last = parts.length > 1 ? parts.slice(1).join(" ") : "";
  return { first, last };
}
