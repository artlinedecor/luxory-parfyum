import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import type { PublicProductRow } from "@/lib/product-search";

/**
 * Tashqi xizmatlar (ChatPlace AI sotuvchisi) uchun ommaviy API yordamchilari.
 * Mahsulot ma'lumoti saytda ham ochiq, lekin kalit so'rovlarni cheklash va
 * manbani bilish uchun kerak. Kalit: Vercel env CHATPLACE_API_KEY.
 */

/** X-Api-Key sarlavhasini vaqtga chidamli taqqoslaydi. Server kaliti bo'sh bo'lsa — hech kimga ruxsat yo'q. */
export function checkApiKey(req: Request, expected: string | undefined): boolean {
  if (!expected) return false;
  const got = req.headers.get("x-api-key") ?? "";
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Kalit va so'rov chegarasini tekshiradi; muammo bo'lsa tayyor javob qaytaradi. */
export function guardPublicRequest(req: Request): NextResponse | null {
  const key = process.env.CHATPLACE_API_KEY;
  if (!checkApiKey(req, key)) {
    return NextResponse.json({ error: "API kaliti noto'g'ri yoki yo'q (X-Api-Key)" }, { status: 401 });
  }
  if (!rateLimit(`chatplace:${key}`, 60, 60_000)) {
    return NextResponse.json({ error: "Juda ko'p so'rov — bir daqiqadan keyin urinib ko'ring" }, { status: 429 });
  }
  return null;
}

const BASE = "id,title,title_ru,price_usd,product_type,image_url,stock";
const FRAGRANCE = "brand,fragrance_name,volume_ml";

/** Saytda ko'rinadigan barcha mahsulotlar. Parfyumeriya ustunlari yo'q bo'lsa asosiy ustunlar bilan (products-query.ts naqshi). */
export async function fetchPublicProducts(): Promise<PublicProductRow[]> {
  const supabase = serverSupabase();
  const run = (cols: string) =>
    supabase.from("products").select(cols).eq("is_available", true).order("stock", { ascending: false });

  const full = await run(`${BASE},${FRAGRANCE}`);
  if (!full.error) return (full.data ?? []) as unknown as PublicProductRow[];
  if (full.error.code !== "42703") throw new Error(full.error.message);

  const base = await run(BASE);
  if (base.error) throw new Error(base.error.message);
  return (base.data ?? []) as unknown as PublicProductRow[];
}

export const NO_STORE = { "Cache-Control": "no-store" };
