import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Check if it's a message
    if (data.message && data.message.text) {
      const chatId = data.message.chat.id;
      const text = data.message.text.trim();
      const token = process.env.TELEGRAM_BOT_TOKEN;

      if (!token) return NextResponse.json({ ok: true });

      let replyMessage = "";

      if (text === "/start") {
        replyMessage = "Assalomu alaykum! Admin ekanligingizni tasdiqlash uchun parolni kiriting:";
      } else if (text === "adminbek1") {
        replyMessage = `✅ Parol qabul qilindi!\n\nSizning Chat ID raqamingiz:\n\n${chatId}\n\nUshbu raqamni nusxalab oling va Vercel'dagi TELEGRAM_CHAT_ID kalitining qiymatiga vergul orqali qo'shib qo'ying.`;
      } else {
        replyMessage = "❌ Noto'g'ri parol.";
      }

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyMessage,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
