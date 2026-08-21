import { NextResponse } from "next/server";
import {
  createOrder,
  productIdToInt,
  uzumErrorPayload,
  UZUM_DEFAULT_CATEGORY,
  UZUM_UNIT_PIECE,
} from "@/lib/uzumnasiya";
import { computeOrderTotal } from "@/lib/pricing-server";

/**
 * Shartnoma yaratish (3-bosqich).
 * Kutadi: { user_id, period, products:[{product_id(uuid|int), name, price, amount}], ext_order_id? }
 * Qaytaradi: { webview_path, contract_id } — webview_path OTP/imzolash uchun ochiladi.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, period, products, ext_order_id } = body as {
      user_id: number;
      period: string;
      products: { product_id: string | number; name: string; price: number; amount: number }[];
      ext_order_id?: number | string;
    };

    if (!user_id || !period || !products?.length) {
      return NextResponse.json(
        { error: "user_id, period va products majburiy" },
        { status: 400 }
      );
    }

    // ⚠️ Audit P2: mijoz yuborgan `price` va `name` E'TIBORSIZ qoldiriladi.
    // Oldin ular to'g'ridan-to'g'ri Uzumga uzatilardi — 800 000 so'mlik
    // atirga 10 000 so'mlik shartnoma rasmiylashtirish mumkin edi.
    const { lines } = await computeOrderTotal(
      products.map((p) => ({
        product_id: String(p.product_id),
        quantity: Number(p.amount),
      }))
    );

    const mapped = lines.map((l) => ({
      product_id: productIdToInt(l.product_id),
      name: l.title.slice(0, 255),
      price: l.price_uzs,
      amount: l.quantity,
      category: UZUM_DEFAULT_CATEGORY,
      unit_id: UZUM_UNIT_PIECE,
    }));

    // ⚠️ ext_order_id BUTUN SON bo'lishi shart (API string'ni rad etadi)
    const orderId = Number(ext_order_id) || Date.now() % 2147483647;
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://parfumelux.uz";

    const res = await createOrder({
      user_id,
      period,
      products: mapped,
      ext_order_id: orderId,
      callback: `${base}/payment-success?order_id=${orderId}`,
    });

    return NextResponse.json({
      success: true,
      webview_path: res.data.webview_path,
      contract_id: res.data.paymart_client.contract_id, // confirm / check-status uchun
      order: res.data.paymart_client.order, // ⚠️ cancel uchun aynan shu
      client_act_pdf: res.data.client_act_pdf,
      price_month: res.data.paymart_client.price_month,
      total: res.data.paymart_client.total,
      ext_order_id: orderId,
    });
  } catch (error) {
    const { body, status } = uzumErrorPayload(error);
    console.error("Uzum create-order error:", body.error);
    return NextResponse.json(body, { status });
  }
}
