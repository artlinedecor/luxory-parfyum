import crypto from "crypto";

/**
 * Click Merchant API — fiskalizatsiya (OFD).
 * Manba: https://docs.click.uz/en/merchant-api/fiscalization/
 *
 * Click rasmiy ravishda ogohlantirgan: chek fiskalizatsiyasi BUGUNGI
 * KUNDA MAJBURIY, va 1 tadan ortiq IKPU ishlatilsa bu metod integratsiya
 * qilinishi shart.
 *
 * ⚠️ Eski kodda uchta xato bor edi:
 *   1. CommissionInfo (TIN yoki PINFL) UMUMAN yuborilmasdi — hujjatda u
 *      MAJBURIY maydon, ya'ni har bir chek rad etilardi.
 *   2. `item.price_uzs || 0` ishlatilardi, lekin savat qatorlarida
 *      price_uzs yo'q edi => har bir pozitsiya GoodPrice:0, Price:0.
 *   3. CLICK_SERVICE_ID env yo'q edi => funksiya jimgina null qaytarardi
 *      va hech kim fiskal chek yaratilmayotganini bilmasdi.
 */

const OFD_URL = "https://api.click.uz/v2/merchant/payment/ofd_data/submit_items";

/** Parfyumeriya uchun IKPU/SPIC va qadoq kodi. */
const SPIC_PARFUM = "03303001001000000";
const PACKAGE_CODE = "799000";
const VAT_PERCENT = 12;

type OrderItem = {
  title?: string;
  quantity?: number;
  price_uzs?: number;
};

type OrderRow = {
  id?: string;
  items?: OrderItem[] | null;
  total_amount?: number | null;
};

function authHeader(merchantUserId: string, secretKey: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const digest = crypto.createHash("sha1").update(timestamp + secretKey).digest("hex");
  return `${merchantUserId}:${digest}:${timestamp}`;
}

/**
 * Fiskal chek ma'lumotini Click'ga yuboradi.
 * @returns null — yuborilmadi (sabab logga yoziladi)
 */
export async function submitOfdData(order: OrderRow, clickPaymentId: number) {
  const merchantUserId = process.env.CLICK_MERCHANT_USER_ID;
  const secretKey = process.env.CLICK_SECRET_KEY;
  const serviceId = process.env.CLICK_SERVICE_ID;
  const tin = process.env.CLICK_OFD_TIN;
  const pinfl = process.env.CLICK_OFD_PINFL;

  if (!merchantUserId || !secretKey || !serviceId) {
    console.error("[OFD] Click kalitlari sozlanmagan — fiskal chek yaratilmadi", {
      has_merchant_user_id: Boolean(merchantUserId),
      has_secret_key: Boolean(secretKey),
      has_service_id: Boolean(serviceId),
      order_id: order.id,
    });
    return null;
  }

  // Hujjat: CommissionInfo MAJBURIY va TIN yoki PINFL bo'lishi shart.
  if (!tin && !pinfl) {
    console.error(
      "[OFD] CLICK_OFD_TIN yoki CLICK_OFD_PINFL sozlanmagan — Click chekni RAD ETADI",
      { order_id: order.id }
    );
    return null;
  }

  const rows = (order.items ?? []).filter((i) => Number(i?.quantity) > 0);
  if (!rows.length) {
    console.error("[OFD] buyurtmada pozitsiya yo'q", { order_id: order.id });
    return null;
  }

  const items = rows.map((item) => {
    // ⚠️ Narx SO'MDA saqlanadi (pricing-server.ts), OFD esa TIYINDA kutadi.
    const uzs = Math.round(Number(item.price_uzs || 0));
    const goodPriceTiyin = uzs * 100;
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const totalTiyin = goodPriceTiyin * quantity;
    // QQS summasi narx ICHIDA: total * 12 / 112
    const vatTiyin = Math.round((totalTiyin * VAT_PERCENT) / (100 + VAT_PERCENT));

    return {
      Name: String(item.title || "Atir").slice(0, 63),
      SPIC: SPIC_PARFUM,
      PackageCode: PACKAGE_CODE,
      GoodPrice: goodPriceTiyin,
      Price: totalTiyin,
      Amount: quantity,
      VAT: vatTiyin,
      VATPercent: VAT_PERCENT,
      CommissionInfo: tin ? { TIN: tin } : { PINFL: pinfl },
    };
  });

  const sumPositions = items.reduce((s, i) => s + i.Price, 0);

  if (items.some((i) => i.Price <= 0)) {
    console.error("[OFD] pozitsiya narxi nol — chek yuborilmadi", {
      order_id: order.id,
      items: items.map((i) => ({ Name: i.Name, Price: i.Price })),
    });
    return null;
  }

  // Hujjat talabi: pozitsiyalar yig'indisi to'lov summasiga teng bo'lishi kerak.
  // Yig'indini o'zimiz hisoblaymiz — total_amount bilan tafovut bo'lsa
  // Click chekni rad etadi.
  const totalUzs = Math.round(Number(order.total_amount || 0));
  if (totalUzs > 0 && sumPositions !== totalUzs * 100) {
    console.error("[OFD] pozitsiyalar yig'indisi buyurtma summasiga teng emas", {
      order_id: order.id,
      sum_positions_tiyin: sumPositions,
      order_total_tiyin: totalUzs * 100,
    });
    return null;
  }

  const payload = {
    service_id: parseInt(serviceId, 10),
    payment_id: clickPaymentId,
    items,
    received_ecash: 0,
    received_cash: 0,
    received_card: sumPositions,
  };

  try {
    const res = await fetch(OFD_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Auth: authHeader(merchantUserId, secretKey),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || Number(data?.error_code) !== 0) {
      console.error("[OFD] Click rad etdi", {
        order_id: order.id,
        http: res.status,
        error_code: data?.error_code,
        error_note: data?.error_note,
      });
      return null;
    }

    console.log("[OFD] fiskal chek yuborildi", {
      order_id: order.id,
      payment_id: clickPaymentId,
      positions: items.length,
    });
    return data;
  } catch (e) {
    console.error("[OFD] tarmoq xatosi", { order_id: order.id, error: e });
    return null;
  }
}

/**
 * To'langan buyurtmaning fiskal chek QR havolasini oladi (soliq.uz).
 * Manba: GET /v2/merchant/payment/ofd_data/:service_id/:payment_id
 */
export async function getFiscalQrUrl(clickPaymentId: number): Promise<string | null> {
  const merchantUserId = process.env.CLICK_MERCHANT_USER_ID;
  const secretKey = process.env.CLICK_SECRET_KEY;
  const serviceId = process.env.CLICK_SERVICE_ID;
  if (!merchantUserId || !secretKey || !serviceId) return null;

  try {
    const res = await fetch(
      `https://api.click.uz/v2/merchant/payment/ofd_data/${serviceId}/${clickPaymentId}`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Auth: authHeader(merchantUserId, secretKey),
        },
      }
    );
    const data = await res.json().catch(() => ({}));
    return data?.qrCodeURL || null;
  } catch (e) {
    console.error("[OFD] chek havolasini olib bo'lmadi", e);
    return null;
  }
}
