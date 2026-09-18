import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guard";
import { serverSupabase } from "@/lib/supabase-server";

/**
 * Dashboard uchun o'qish — barcha sahifalar shu yerdan ma'lumot oladi.
 * Faqat admin sessiyasi bilan ishlaydi (audit X7).
 */
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const supabase = serverSupabase();
    const [prodRes, ordRes, txRes, ucRes] = await Promise.all([
      supabase.from("products").select("*").order("title", { ascending: true }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      // Uzum Nasiya shartnomalari — orders.uzum_contract_id USTUNI YO'Q,
      // shartnoma bog'lanishi shu jadval orqali (order_row_id).
      supabase.from("uzum_contracts").select("*").order("created_at", { ascending: false }),
    ]);

    // ⚠️ Audit D5: xatolar endi yutilmaydi — oldin dashboard bo'sh
    // ro'yxat ko'rsatib, hech kim sababni bilmasdi.
    const firstError = prodRes.error || ordRes.error || txRes.error;
    if (firstError) {
      console.error("[dashboard/data]", firstError);
      return NextResponse.json(
        { error: `Ma'lumot olishda xatolik: ${firstError.message}` },
        { status: 500 }
      );
    }
    if (ucRes.error) {
      // Bu jadval yo'qligi umumiy dashboard'ni to'xtatmasin — faqat log.
      console.error("[dashboard/data] uzum_contracts", ucRes.error);
    }

    return NextResponse.json({
      products: prodRes.data ?? [],
      orders: ordRes.data ?? [],
      transactions: txRes.data ?? [],
      uzumContracts: ucRes.data ?? [],
    });
  } catch (e) {
    console.error("[dashboard/data]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Xatolik" },
      { status: 500 }
    );
  }
}
