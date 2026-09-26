import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { fetchPublicProducts } from "@/lib/public-api";
import { findShortLinkProduct } from "@/lib/product-search";

/**
 * ChatPlace AI sotuvchisi mijozga yuboradigan qisqa havola:
 * https://parfumelux.uz/a/dior-sauvage-elixir → shu atir sahifasi.
 * Bot havolani atir nomidan o'zi yasaydi, shuning uchun nom biroz boshqacha
 * yozilsa ham eng mos atir topiladi; topilmasa — katalog.
 * Qo'llanma: docs/chatplace-ulash.md
 */
const UTM = "utm_source=chatplace&utm_medium=bot";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  let target = `${base}/catalog?${UTM}&utm_content=${encodeURIComponent(slug.slice(0, 80))}`;
  try {
    const product = findShortLinkProduct(await fetchPublicProducts(), slug.slice(0, 120));
    if (product) target = `${base}/catalog/${product.id}?${UTM}`;
  } catch (e) {
    console.error("[a/slug]", e);
  }
  return NextResponse.redirect(target, { status: 307, headers: { "Cache-Control": "no-store" } });
}
