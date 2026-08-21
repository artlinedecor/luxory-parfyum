import { createClient } from "@/utils/supabase/client";
import type { Product } from "./types";

/**
 * Ro'yxat uchun eng kam ustunlar — tavsiflar olinmaydi (242KB -> 80KB edi).
 * Bu ustunlar bazada HAR DOIM bor.
 */
const BASE_COLUMNS =
  "id,title,title_ru,price_usd,image_url,product_type,gender,stock,created_at";

/**
 * Parfyumeriya ustunlari — migrations/002_fragrance_fields.sql qo'llanganidan
 * keyin paydo bo'ladi. Ular kartochkadagi brend/hajm/akkord va aqlli
 * filtrlar uchun kerak.
 */
const FRAGRANCE_COLUMNS =
  "brand,fragrance_name,volume_ml,concentration,image_url_2,accords,note_families,seasons,time_of_day";

/** Migratsiya qo'llanganmi — bir marta aniqlanadi, keyin eslab qolinadi. */
let hasFragranceColumns: boolean | null = null;

/**
 * Katalog ro'yxatini oladi.
 *
 * Migratsiya hali qo'llanmagan bo'lsa Supabase noma'lum ustun uchun xato
 * qaytaradi — o'shanda avtomatik ravishda faqat asosiy ustunlar bilan qayta
 * so'raymiz. Shu tufayli migratsiyadan oldin ham, keyin ham katalog ishlaydi.
 */
export async function fetchCatalogProducts(): Promise<Product[]> {
  const supabase = createClient();

  const run = (columns: string) =>
    supabase
      .from("products")
      .select(columns)
      .eq("is_available", true)
      // 71b22ee: sotuvda bor mahsulotlar ro'yxat boshida
      .order("stock", { ascending: false })
      .order("created_at", { ascending: false });

  if (hasFragranceColumns !== false) {
    const { data, error } = await run(`${BASE_COLUMNS},${FRAGRANCE_COLUMNS}`);
    if (!error) {
      hasFragranceColumns = true;
      return (data ?? []) as unknown as Product[];
    }
    // 42703 = undefined_column: migratsiya hali qo'llanmagan
    hasFragranceColumns = false;
    if (error.code !== "42703") {
      console.error("Katalog so'rovi xatosi:", error);
    }
  }

  const { data, error } = await run(BASE_COLUMNS);
  if (error) {
    console.error("Katalog so'rovi xatosi:", error);
    return [];
  }
  return (data ?? []) as unknown as Product[];
}
