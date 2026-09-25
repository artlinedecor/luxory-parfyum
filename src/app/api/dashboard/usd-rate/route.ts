import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guard";
import { serverSupabase } from "@/lib/supabase-server";
import { isValidUsdRate, USD_RATE_MIN, USD_RATE_MAX } from "@/lib/accounting";
import { USD_RATE_KEY } from "@/lib/usd-rate-server";

/**
 * Buxgalteriya kursini ($ → so'm) o'zgartirish. Yangi kurs faqat
 * bundan keyin kiritiladigan rasxod va qo'lda buyurtmalarga ta'sir
 * qiladi — eski yozuvlar o'z kursida qoladi.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { rate } = (await req.json()) as { rate?: unknown };
    const n = Math.round(Number(rate));
    if (!isValidUsdRate(n)) {
      throw new Error(`Kurs ${USD_RATE_MIN} – ${USD_RATE_MAX} so'm oralig'ida bo'lishi kerak`);
    }

    const { error } = await serverSupabase()
      .from("app_settings")
      .upsert({ key: USD_RATE_KEY, value: n, updated_at: new Date().toISOString() });
    if (error) throw new Error(`Kurs saqlanmadi: ${error.message}`);

    return NextResponse.json({ rate: n });
  } catch (e) {
    console.error("[dashboard/usd-rate]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Xatolik" },
      { status: 400 }
    );
  }
}
