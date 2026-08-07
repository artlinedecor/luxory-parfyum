import { NextResponse } from "next/server";
import { calculateTariffs, type CalculateProduct } from "@/lib/uzumnasiya";

/**
 * 2-bosqich: savat bo'yicha tariflarni hisoblash.
 * Kutadi: { user_id, products:[{product_id, price, amount}] }
 * Qaytaradi: tariflar ro'yxati (tariff, tariff_name, period_months, month, total, ...).
 */
export async function POST(req: Request) {
  try {
    const { user_id, products } = (await req.json()) as {
      user_id: number;
      products: CalculateProduct[];
    };
    if (!user_id || !products?.length) {
      return NextResponse.json(
        { error: "user_id va products majburiy" },
        { status: 400 }
      );
    }
    const res = await calculateTariffs(user_id, products);
    return NextResponse.json({ success: true, tariffs: res.data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
