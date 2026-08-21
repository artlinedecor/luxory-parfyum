/**
 * Uzum Nasiya Partner API (v1.0.2) integratsiyasi
 * Docs: https://developer.uzumbank.uz/nasiya/
 *
 * Oqim (4 bosqich):
 *   1) POST /api/v1/buyers/check-status  — foydalanuvchi statusi + user_id + limit
 *   2) POST /api/v1/orders/calculate     — savat bo'yicha tariflar ro'yxati
 *   3) POST /api/v1/orders               — shartnoma yaratish -> contract_id + webview_path (OTP)
 *   4) POST /api/v1/contracts/confirm | /cancel  — aktivlashtirish yoki bekor qilish
 *   (+) POST /api/v1/contracts/check-status      — shartnoma holati
 *
 * Auth: Authorization: Bearer <UZUM_PARTNER_TOKEN>  (token Uzum menejeri beradi)
 */

// Partner (MFO) API host. Env orqali override qilish mumkin (test/prod).
export const UZUM_API_URL = (
  process.env.UZUM_API_URL || "https://merchants-api.uzumnasiya.uz"
).replace(/\/+$/, ""); // oxiridagi slash olib tashlanadi (// oldini olish)

// Mahsulot standart qiymatlari (Uzum bilan tasdiqlanishi kerak)
export const UZUM_UNIT_PIECE = 1; // dona
export const UZUM_DEFAULT_CATEGORY = Number(process.env.UZUM_CATEGORY || 1);

// UUID (partner mahsulot id) -> barqaror musbat integer (Uzum integer kutadi)
export function productIdToInt(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) {
    h = (Math.imul(h, 31) + uuid.charCodeAt(i)) >>> 0;
  }
  return h % 2147483647 || 1;
}

// ── Foydalanuvchi statuslari ────────────────────────────────────────────
export const BUYER_STATUS = {
  NOT_FOUND: 0, // Uzum Nasiya'da topilmadi
  NEEDS_REGISTRATION: 1, // ro'yxatdan o'tib karta qo'shish kerak
  DOC_CHECK: 2, // hujjatlar tekshirilmoqda
  VERIFIED: 4, // ✅ tasdiqlangan — rassrochka mumkin
  NEED_PASSPORT_PHOTO: 5,
  BLACKLISTED: 8, // bloklangan / qarzdorlik 60+ kun
  BLOCKED: 9,
  NEED_SELFIE: 10,
  NEED_PASSPORT_PAGE: 11,
  NEED_CONTACT: 12,
  CALL_CENTER: 13,
  CALL_CENTER_VENDOR: 14,
  HAS_DEBT: 403,
} as const;

// Ro'yxatdan o'tish WebView'ini ochish kerak bo'lgan statuslar
export const NEEDS_REGISTRATION_STATUSES = [0, 1, 2, 5, 10, 11, 12];
// Rasmiylashtirish MUMKIN EMAS statuslar
export const REJECTED_STATUSES = [8, 9, 13, 14, 403];

// ── Shartnoma statuslari ────────────────────────────────────────────────
export const CONTRACT_STATUS = {
  NOT_CONFIRMED: 0,
  ACTIVE: 1,
  MODERATION: 2,
  OVERDUE_60: 3,
  OVERDUE_30: 4,
  CANCELLED: 5,
  CLOSED: 9,
} as const;

// ── Tiplar ──────────────────────────────────────────────────────────────
export interface UzumApiResponse<T> {
  status: "success" | "error";
  error: unknown[];
  data: T;
  response_code?: number;
}

export interface CalculateProduct {
  product_id: number;
  price: number; // UZS, Uzum naценkasiz
  amount: number;
}

export interface CreateOrderProduct {
  amount: number;
  name: string;
  price: number; // UZS, Uzum наценkasiz
  category: number;
  unit_id: number; // o'lchov birligi (dona=1)
  product_id?: number;
}

/** check-status javobi (dev API'da jonli tekshirilgan) */
export interface BuyerStatusData {
  phone: string;
  status: number; // 4 = tasdiqlangan
  buyer_id: number; // ⚠️ 'user_id' EMAS — keyingi so'rovlarda user_id sifatida uzatiladi
  has_limit: boolean;
  balance: string; // "60932750.00"
  is_in_black_list: boolean;
  has_overdue_contracts: boolean;
  risk_grade?: string;
  verified_at?: string;
  webview?: string; // ro'yxatdan o'tish/verifikatsiya WebView URL
  custom_discount?: number | null;
  available_periods?: {
    period: string;
    title_uz: string;
    title_ru: string;
    original_markup: number;
    discount_markup: number;
    available_balance: string;
  }[];
}

/** calculate javobi (jonli tekshirilgan) */
export interface CalculatedTariff {
  tariff_id: number;
  tariff: string; // create-order 'period' ga uzatiladi (masalan "6-standard", "003", "12 Default")
  tariff_name: string; // masalan "Limit Max"
  title_uz: string; // masalan "6 Oy 29%"
  title_ru: string;
  period_months: number;
  total: number; // ustama bilan umumiy
  origin: number; // ustamasiz asl narx
  month: number; // oylik to'lov
  first_payment_date: string;
  deposit: number;
  balance: string;
  is_available: boolean;
  status: number;
  is_promo: number;
  is_mini_loan: number;
  client_photo_upload: number;
  error_message?: string;
}

/** create-order javobidagi shartnoma ma'lumoti (jonli tekshirilgan) */
export interface PaymartClient {
  fio: string;
  phone: string;
  order: number; // ⚠️ CANCEL uchun aynan SHU id ishlatiladi
  contract_id: number; // ⚠️ CONFIRM va CHECK-STATUS uchun SHU id
  created_at: string;
  price_month: string; // "172000.00"
  total: string; // "1032000.00"
  available_balance: string;
  mini_balance: string;
}

export interface CreateOrderResult {
  paymart_client: PaymartClient;
  cart: unknown;
  client_act_pdf: string;
  webview_path: string; // OTP/imzolash WebView URL
}

/** Route'lar uchun: xatoni {error, response_code} + HTTP status ga aylantiradi */
export function uzumErrorPayload(e: unknown): {
  body: { error: string; response_code?: number };
  status: number;
} {
  if (e instanceof UzumError) {
    return {
      body: { error: e.message, response_code: e.responseCode },
      status: e.httpStatus >= 400 && e.httpStatus < 600 ? e.httpStatus : 500,
    };
  }
  return {
    body: { error: e instanceof Error ? e.message : "Noma'lum xatolik" },
    status: 500,
  };
}

/** Uzum biznes/HTTP xatosi — response_code va o'qiladigan matn bilan */
export class UzumError extends Error {
  httpStatus: number;
  responseCode?: number;
  constructor(message: string, httpStatus: number, responseCode?: number) {
    super(message);
    this.name = "UzumError";
    this.httpStatus = httpStatus;
    this.responseCode = responseCode;
  }
}

// ── Ichki fetch yordamchisi ─────────────────────────────────────────────

/** Vaqtinchalik (qayta urinsa o'tadigan) xatolar */
function isTransient(status: number, text: string): boolean {
  if (status >= 500) return true;
  return /Внешний сервис|не отвеча|timeout|timed out|попробуйте позже|Service Unavailable/i.test(text || "");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * @param retries — faqat IDEMPOTENT (hech narsa yaratmaydigan) metodlar uchun.
 *   ⚠️ create-order / confirm / cancel da 0 bo'lishi SHART — aks holda
 *   takroriy shartnoma yoki ikki marta tasdiqlash xavfi bor.
 */
async function uzumFetch<T>(
  path: string,
  body: unknown,
  retries = 0
): Promise<UzumApiResponse<T>> {
  const token = process.env.UZUM_PARTNER_TOKEN;
  if (!token) throw new UzumError("UZUM_PARTNER_TOKEN sozlanmagan", 500);

  let lastErr: UzumError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(700 * attempt); // qisqa kutish

    let res: Response;
    try {
      res = await fetch(`${UZUM_API_URL}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      lastErr = new UzumError("Uzum tizimiga ulanib bo'lmadi", 503);
      continue; // tarmoq xatosi — qayta urinamiz
    }

    const raw = await res.text();
    let json: UzumApiResponse<T> & { message?: string };
    try {
      json = JSON.parse(raw);
    } catch {
      lastErr = new UzumError(`Uzum javobi o'qilmadi (${res.status})`, res.status);
      if (isTransient(res.status, raw)) continue;
      throw lastErr;
    }

    if (res.status === 401) throw new UzumError("Avtorizatsiya xatosi (token)", 401);

    if (!res.ok || json.status === "error") {
      // Uzum xatolari: [{type:'danger', text:'...'}] yoki {message:'...'}
      const errArr = json.error as { text?: string }[] | undefined;
      const text =
        (Array.isArray(errArr) && errArr[0]?.text) ||
        json.message ||
        `Xatolik (${res.status})`;
      lastErr = new UzumError(text, res.status, json.response_code);
      if (isTransient(res.status, text)) continue; // vaqtinchalik — qayta urinamiz
      throw lastErr;
    }
    return json;
  }

  throw lastErr ?? new UzumError("Uzum tizimi javob bermadi", 503);
}

// ── 1) Foydalanuvchi statusi ────────────────────────────────────────────
// phone: 998XXXXXXXXX (12 raqam)
export function checkBuyerStatus(phone: number) {
  return uzumFetch<BuyerStatusData>("/api/v1/buyers/check-status", { phone }, 2);
}

// ── 2) Tariflarni hisoblash ─────────────────────────────────────────────
export function calculateTariffs(user_id: number, products: CalculateProduct[]) {
  return uzumFetch<CalculatedTariff[]>(
    "/api/v1/orders/calculate",
    { user_id, products },
    2
  );
}

// ── 3) Shartnoma yaratish ───────────────────────────────────────────────
// ⚠️ ext_order_id BUTUN SON bo'lishi shart (hujjatda 'string' deb yozilgan — noto'g'ri,
//    API "Поле ext order id должно быть целым числом" xatosini qaytaradi).
export function createOrder(params: {
  user_id: number; // check-status'dagi buyer_id
  period: string; // tanlangan tarifning 'tariff' qiymati
  products: CreateOrderProduct[];
  callback?: string;
  ext_order_id?: number;
}) {
  return uzumFetch<CreateOrderResult>("/api/v1/orders", params);
}

// ── 4) Shartnomani boshqarish ───────────────────────────────────────────
/** Tasdiqlash — `contract_id` (paymart_client.contract_id) bilan. */
export function confirmContract(contract_id: number) {
  return uzumFetch<{ act_pdf?: string } & Record<string, unknown>>(
    "/api/v1/contracts/confirm",
    { contract_id }
  );
}

/**
 * Bekor qilish — ⚠️ bu yerda `paymart_client.order` uzatiladi (contract_id EMAS).
 * contract_id bilan API 404 "Договор не найден" qaytaradi (jonli tekshirilgan).
 */
export function cancelContract(order: number) {
  return uzumFetch<unknown>("/api/v1/contracts/cancel", { contract_id: order });
}

/** Holat tekshirish — `contract_id` bilan. */
export function checkContractStatus(contract_id: number) {
  return uzumFetch<{
    id: number;
    status: number;
    contract_id: number;
    contract_status: number;
    is_signed: boolean;
    qr_status: number;
    type: string;
  }>("/api/v1/contracts/check-status", { contract_id }, 2);
}
