import { NextResponse } from "next/server";
import { calculateTariffs, productIdToInt, uzumErrorPayload } from "@/lib/uzumnasiya";
import { computeOrderTotal } from "@/lib/pricing-server";

/**
 * 2-bosqich: savat bo'yicha tariflarni hisoblash.
 * Kutadi: { user_id, products:[{product_id(uuid|int), price, amount}] }
 * Qaytaradi: tariflar ro'yxati (tariff, tariff_name, period_months, month, total, ...).
 */
export async function POST(req: Request) {
  try {
    const { user_id, products } = (await req.json()) as {
      user_id: number;
      products: { product_id: string | number; price: number; amount: number }[];
    };
    if (!user_id || !products?.length) {
      return NextResponse.json(
        { error: "user_id va products majburiy" },
        { status: 400 }
      );
    }
    // ⚠️ Audit P2: narx bazadan. Aks holda tarif bir summaga, shartnoma
    // boshqa summaga tuzilardi va mijoz noto'g'ri oylik to'lov ko'rardi.
    const { lines } = await computeOrderTotal(
      products.map((p) => ({
        product_id: String(p.product_id),
        quantity: Number(p.amount),
      }))
    );

    const mapped = lines.map((l) => ({
      product_id: productIdToInt(l.product_id),
      price: l.price_uzs,
      amount: l.quantity,
    }));
    const res = await calculateTariffs(user_id, mapped);

    // Diagnostika: "mavjud tarif yoq" holatida sababni Vercel loglarida korish uchun.
    const list = Array.isArray(res.data) ? res.data : [];
    if (!list.some((t) => t.is_available)) {
      console.warn("[uzum/calculate] mavjud tarif yoq", {
        user_id,
        total: mapped.reduce((s, p) => s + p.price * p.amount, 0),
        items: mapped.length,
        tariffs: list.map((t) => ({
          tariff: t.tariff,
          period_months: t.period_months,
          is_available: t.is_available,
          status: t.status,
          error_message: t.error_message,
        })),
      });
    }

    return NextResponse.json({ success: true, tariffs: res.data });
  } catch (error) {
    const { body, status } = uzumErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
