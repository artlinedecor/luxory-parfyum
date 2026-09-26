import { NextResponse, after } from "next/server";
import { siteConfig } from "@/config/site";
import { fetchPublicProducts } from "@/lib/public-api";
import { findShortLinkProduct } from "@/lib/product-search";
import { rateLimit } from "@/lib/rate-limit";
import { sendAdminTelegram } from "@/lib/telegram-admin";

/**
 * ChatPlace AI sotuvchisi mijozga yuboradigan qisqa havola:
 * https://parfumelux.uz/a/dior-sauvage-elixir → shu atir sahifasi.
 * Bot havolani atir nomidan o'zi yasaydi, shuning uchun nom biroz boshqacha
 * yozilsa ham eng mos atir topiladi; topilmasa — katalog va adminlarga Telegram
 * xabari (mijozlar so'ragan, lekin katalogda yo'q atirlar — egasi talabi).
 * Qo'llanma: docs/chatplace-ulash.md
 */
const UTM = "utm_source=chatplace&utm_medium=bot";
const DAY = 24 * 60 * 60 * 1000;
const SEARCH_BOTS = /googlebot|bingbot|yandex|baiduspider|duckduckbot|ahrefs|semrush|petalbot|gptbot|claudebot/i;

/** "creed-viking" → "Creed Viking" */
const slugTitle = (slug: string) =>
  slug.replace(/[-_+.]+/g, " ").trim().replace(/\s+/g, " ").replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  let target = `${base}/catalog?${UTM}&utm_content=${encodeURIComponent(slug.slice(0, 80))}`;
  try {
    const product = findShortLinkProduct(await fetchPublicProducts(), slug.slice(0, 120));
    if (product) {
      target = `${base}/catalog/${product.id}?${UTM}`;
    } else if (
      /\p{L}{3}/u.test(slug) &&
      !SEARCH_BOTS.test(req.headers.get("user-agent") ?? "") &&
      rateLimit(`a-miss:${slug.toLowerCase().slice(0, 80)}`, 1, DAY) && // bir atir — kuniga bir xabar
      rateLimit("a-miss:all", 30, 60 * 60 * 1000) // spam bo'lsa ham soatiga 30 tadan oshmasin
    ) {
      const name = slugTitle(slug.slice(0, 80));
      after(() =>
        sendAdminTelegram(`🔎 Mijoz so'radi, katalogda YO'Q: ${name}\n(ChatPlace bot havolasi: ${base}/a/${slug.slice(0, 80)})`)
          .catch((e) => console.error("[a/slug] telegram", e)),
      );
    }
  } catch (e) {
    console.error("[a/slug]", e);
  }
  return NextResponse.redirect(target, { status: 307, headers: { "Cache-Control": "no-store" } });
}
