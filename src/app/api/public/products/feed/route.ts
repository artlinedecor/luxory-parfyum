import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { guardPublicRequest, fetchPublicProducts, NO_STORE } from "@/lib/public-api";
import { toPublicItem } from "@/lib/product-search";

/**
 * Butun katalog bitta JSON'da — ChatPlace AI bilim bazasi uchun.
 * GET /api/public/products/feed   (sarlavha: X-Api-Key)
 */
export async function GET(req: Request) {
  const denied = guardPublicRequest(req);
  if (denied) return denied;

  try {
    const items = (await fetchPublicProducts()).map((p) => toPublicItem(p, siteConfig.siteUrl));
    return NextResponse.json({ count: items.length, items }, { headers: NO_STORE });
  } catch (e) {
    console.error("[public/products/feed]", e);
    return NextResponse.json({ error: "Katalogni o'qib bo'lmadi" }, { status: 500, headers: NO_STORE });
  }
}
