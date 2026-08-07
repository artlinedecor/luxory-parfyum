import { NextResponse } from "next/server";
import { createOrder, type CreateOrderProduct } from "@/lib/uzumnasiya";

/**
 * Shartnoma yaratish (3-bosqich).
 * Kutadi: { user_id, period, products:[{name, price, amount, category, unit_id, product_id?}], ext_order_id? }
 * Qaytaradi: { webview_path, contract_id } — webview_path OTP/imzolash uchun ochiladi.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, period, products, ext_order_id } = body as {
      user_id: number;
      period: string;
      products: CreateOrderProduct[];
      ext_order_id?: string;
    };

    if (!user_id || !period || !products?.length) {
      return NextResponse.json(
        { error: "user_id, period va products majburiy" },
        { status: 400 }
      );
    }

    const orderId = ext_order_id || crypto.randomUUID();
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://parfumelux.uz";

    const res = await createOrder({
      user_id,
      period,
      products,
      ext_order_id: orderId,
      callback: `${base}/payment-success?order_id=${orderId}`,
    });

    return NextResponse.json({
      success: true,
      webview_path: res.data.webview_path,
      contract_id: res.data.paymart_client.contract_id,
      client_act_pdf: res.data.client_act_pdf,
      ext_order_id: orderId,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Uzum create-order error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
