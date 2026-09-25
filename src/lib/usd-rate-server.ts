import type { SupabaseClient } from "@supabase/supabase-js";
import { USD_TO_UZS, isValidUsdRate } from "@/lib/accounting";

export const USD_RATE_KEY = "usd_to_uzs";

/**
 * Dashboard'da kiritilgan joriy kurs (app_settings jadvali).
 * Jadval hali yaratilmagan (migrations/09) yoki qiymat buzuq bo'lsa —
 * USD_TO_UZS, dashboard ishlashdan to'xtamasin.
 */
export async function getUsdRate(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase
    .from("app_settings").select("value").eq("key", USD_RATE_KEY).maybeSingle();
  if (error) {
    console.warn("[usd-rate] app_settings o'qilmadi, standart kurs ishlatiladi:", error.message);
    return USD_TO_UZS;
  }
  const v = Number(data?.value);
  return isValidUsdRate(v) ? v : USD_TO_UZS;
}
