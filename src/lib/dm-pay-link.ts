import crypto from "crypto";

/**
 * DM'da yuboriladigan doimiy Click to'lov havolasi: /tolov/<kod>.
 * Har ochilganda 1 ta atirlik buyurtma yaratib, to'g'ridan-to'g'ri Click'ga
 * yuboradi. Summani server belgilaydi — mijoz o'zgartira olmaydi.
 */

export const DM_PAY_AMOUNT_UZS = 650_000;
export const DM_PAY_REGION = "DM to'lov havolasi";

// Repo ochiq, shuning uchun kodning o'zi emas, faqat sha256 xeshi saqlanadi.
// Havola begona qo'lga tushsa — yangi kod yaratib, shu xeshni almashtiring.
const DM_PAY_TOKEN_SHA256 = "a5b6fa91cce743b4340022f5c78cf1fe22154386fbfd3150224c8140ee012818";

export function tokenMatchesHash(token: string, expectedHex: string): boolean {
  if (!token) return false;
  const actual = crypto.createHash("sha256").update(token).digest();
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function isValidDmPayToken(token: string): boolean {
  return tokenMatchesHash(token, DM_PAY_TOKEN_SHA256);
}

// Telegram/Instagram havola ko'rinishini (preview) olish uchun sahifani o'zi
// ochadi — ular uchun buyurtma yaratilsa, har DM'da keraksiz buyurtma chiqadi.
const PREVIEW_BOT_RE =
  /bot|crawler|spider|preview|facebookexternalhit|facebot|whatsapp|instagram|telegram|slack|discord|vkshare|skype/i;

export function isLinkPreviewBot(userAgent: string): boolean {
  return Boolean(userAgent) && PREVIEW_BOT_RE.test(userAgent);
}

export function buildDmOrder() {
  return {
    items: [
      {
        product_id: crypto.randomUUID(),
        title: "Lyuks atir (DM taklif)",
        quantity: 1,
        price_uzs: DM_PAY_AMOUNT_UZS,
        product_type: "lux_copy",
      },
    ],
    client_name: "DM mijoz",
    client_phone: "-",
    region: DM_PAY_REGION,
    order_type: "full_payment",
    status: "pending",
    payment_status: "unpaid",
    total_amount: DM_PAY_AMOUNT_UZS,
  };
}

/** Havola ochilib, lekin to'lovga o'tilmagan buyurtma — dashboard'da ko'rsatilmaydi. */
export function isAbandonedDmOrder(order: { region?: string | null; payment_status?: string | null }): boolean {
  return order.region === DM_PAY_REGION && order.payment_status === "unpaid";
}
