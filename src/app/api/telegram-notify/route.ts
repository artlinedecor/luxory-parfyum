import { NextRequest, NextResponse } from 'next/server';
import { requireInternalSecret } from '@/lib/api-guard';
import { calculateOriginalPriceUzs, calculatePremiumPriceUzs, formatUzs } from '@/lib/utils';
import { getAdminChatIds, sendTelegram, escapeHtml } from "@/lib/telegram";

/**
 * Click orqali to'langan buyurtma — adminlarga Telegram xabari (Uzum bilan bir botda).
 * Click buyurtmasi avtomatik qabul qilinadi, shuning uchun tugma yo'q —
 * tasdiqlash tugmalari faqat Uzum Nasiya'da (egasi qarori).
 */
export async function POST(req: NextRequest) {
  // ⚠️ Audit X11: oldin har kim adminlarga soxta buyurtma xabari
  // yubora olardi. Bu route'ni faqat click/complete chaqiradi.
  const denied = requireInternalSecret(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.warn('Telegram Bot token not configured. Skipping notification.');
      return NextResponse.json({ ok: true, skipped: true });
    }

    const { orderId, clientName, clientPhone, region, address, items, totalAmount } = body;

    const productLines = (items || [])
      .map((item: { title: string; product_type: string; quantity: number; price_at_purchase: number }) =>
        `• ${escapeHtml(item.title)} × ${item.quantity} — ${formatUzs(item.product_type === 'original' ? calculateOriginalPriceUzs(item.price_at_purchase) : calculatePremiumPriceUzs(item.price_at_purchase))} so'm`
      )
      .join('\n');

    const text =
      `💳 <b>YANGI BUYURTMA — Click (to'liq to'landi)</b>\n` +
      `<i>Pul tushdi, buyurtma avtomatik qabul qilindi</i>\n\n` +
      `👤 ${escapeHtml(clientName || "—")}\n` +
      `📞 ${escapeHtml(clientPhone || "—")}\n` +
      `📍 ${escapeHtml(region || "")} ${escapeHtml(address || "")}\n\n` +
      `📦 <b>Mahsulotlar:</b>\n${productLines || "—"}\n\n` +
      `💰 Jami: <b>${formatUzs(Number(totalAmount) || 0)} so'm</b>\n` +
      (orderId ? `🔖 Buyurtma: <code>${escapeHtml(String(orderId).slice(0, 8))}</code>\n\n` : `\n`) +
      `📦 Jo'natishga tayyorlang.`;

    const ids = await getAdminChatIds();
    let delivered = 0;
    for (const id of ids) {
      if (await sendTelegram(id, text)) delivered++;
    }
    if (delivered === 0) console.error("[click/notify] xabar hech kimga yetib bormadi", { orderId, tried: ids.length });

    return NextResponse.json({ ok: true, sent: delivered, tried: ids.length });
  } catch (error) {
    console.error('Telegram notification error:', error);
    return NextResponse.json({ ok: true, error: 'notification_failed' });
  }
}
