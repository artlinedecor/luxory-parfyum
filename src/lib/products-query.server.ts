import { createClient } from "@supabase/supabase-js";
import { queryCatalogProducts } from "./products-query";
import type { Product } from "./types";

/**
 * Katalog ro'yxatini SERVERDA oladi.
 *
 * Nega kerak: mahsulotlar `useEffect` ichida olinardi, shuning uchun
 * serverdan kelgan HTMLda ro'yxat bo'sh bo'lardi va "Bu bo'limda
 * hozircha mahsulot yo'q" yozuvi chiqardi. Bot uchun bu yolg'on javob.
 *
 * `utils/supabase/server.ts` emas, to'g'ridan-to'g'ri `@supabase/supabase-js`
 * ishlatiladi - u `cookies()` ga tegmaydi, ya'ni sahifani majburan
 * dinamik qilib qo'ymaydi va keshlashga imkon qoldiradi. Katalog ochiq
 * ma'lumot, foydalanuvchi sessiyasi kerak emas. Aynan shu naqsh
 * `src/app/catalog/[id]/page.tsx` da allaqachon ishlatilgan.
 *
 * Xato bo'lsa bo'sh massiv qaytaradi: sahifa qulab tushmasligi kerak,
 * klient tomondagi qayta so'rov ro'yxatni to'ldiradi.
 */
export async function fetchCatalogProductsServer(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Supabase sozlamalari yo'q - katalog serverda chizilmaydi");
    return [];
  }
  try {
    const supabase = createClient(url, key);
    return await queryCatalogProducts(
      supabase as unknown as ReturnType<
        typeof import("@/utils/supabase/client").createClient
      >,
    );
  } catch (error) {
    console.error("Serverda katalog so'rovi xatosi:", error);
    return [];
  }
}
