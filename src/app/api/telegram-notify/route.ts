import { NextRequest, NextResponse } from 'next/server';

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
        `- ${item.title} (${item.product_type === 'original' ? 'Original' : 'Lux'}) x${item.quantity} — $${item.price_at_purchase}`
      )
      .join('\n');

    const message =
`🛍 YANGI BUYURTMA!
👤 Mijoz: ${clientName}
📞 Telefon: ${clientPhone}
📍 Viloyat: ${region}, Manzil: ${address}

📦 Mahsulotlar:
${productLines}

💰 Jami summa: $${totalAmount}
🧾 To'lov: ${orderType === 'deposit_50' ? '$50 depozit (Chek ilova qilindi)' : "To'liq to'lov"}`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });

    if (receiptUrl) {
      await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: receiptUrl,
          caption: `🧾 To'lov cheki — ${clientName} (${clientPhone})`,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram notification error:', error);
    return NextResponse.json({ ok: true, error: 'notification_failed' });
  }
}
