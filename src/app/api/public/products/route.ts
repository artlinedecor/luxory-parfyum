import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { guardPublicRequest, fetchPublicProducts, NO_STORE } from "@/lib/public-api";
import { searchProducts, toPublicItem, buildReply } from "@/lib/product-search";

/**
 * ChatPlace AI sotuvchisi uchun atir qidiruvi.
 * GET /api/public/products?q=baccarat&limit=5   (sarlavha: X-Api-Key)
 * Qo'llanma: docs/chatplace-ulash.md
 */
export async function GET(req: Request) {
  const denied = guardPublicRequest(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (!q) {
    return NextResponse.json({ error: "q majburiy — atir nomi" }, { status: 400, headers: NO_STORE });
  }
  const limit = Math.min(10, Math.max(1, Number(url.searchParams.get("limit")) || 5));

  try {
    const products = await fetchPublicProducts();
    const items = searchProducts(products, q, limit).map((p) => toPublicItem(p, siteConfig.siteUrl));
    return NextResponse.json({ items, reply: buildReply(items, q) }, { headers: NO_STORE });
  } catch (e) {
    console.error("[public/products]", e);
    return NextResponse.json({ error: "Katalogni o'qib bo'lmadi" }, { status: 500, headers: NO_STORE });
  }
}
