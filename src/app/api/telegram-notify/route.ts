import { NextRequest, NextResponse } from 'next/server';
import { calculateOriginalPriceUzs, calculatePremiumPriceUzs, formatUzs } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.warn('Telegram Bot credentials not configured. Skipping notification.');
      return NextResponse.json({ ok: true, skipped: true });
    }

    const { clientName, clientPhone, region, address, items, totalAmount, orderType, receiptUrl } = body;

    const productLines = (items || [])
      .map((item: { title: string; product_type: string; quantity: number; price_at_purchase: number }) =>
        `- ${item.title} (${item.product_type === 'original' ? 'Original atir' : 'Lyuks Premium atir'}) x${item.quantity} — ${formatUzs(item.product_type === 'original' ? calculateOriginalPriceUzs(item.price_at_purchase) : calculatePremiumPriceUzs(item.price_at_purchase))} so'm`
      )
      .join('\n');

    const message =
`🛍 YANGI BUYURTMA!
👤 Mijoz: ${clientName}
📞 Telefon: ${clientPhone}
📍 Viloyat: ${region}, Manzil: ${address}

📦 Mahsulotlar:
${productLines}

💰 Jami summa: ${formatUzs(totalAmount)} so'm
🧾 To'lov: To'liq to'lov`;

    const chatIds = chatId.split(',').map(id => id.trim()).filter(Boolean);

    for (const id of chatIds) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: id, text: message }),
      });

      if (receiptUrl) {
        await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: id,
            photo: receiptUrl,
            caption: `🧾 To'lov cheki — ${clientName} (${clientPhone})`,
          }),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram notification error:', error);
    return NextResponse.json({ ok: true, error: 'notification_failed' });
  }
}
