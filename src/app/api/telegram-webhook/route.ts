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
        // Save to Supabase users table dynamically
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          const { createClient } = require("@supabase/supabase-js");
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const email = `${chatId}@telegram.bot`;
          const { error } = await supabase.from('users').upsert(
            { email, full_name: 'Telegram Admin', role: 'superadmin' },
            { onConflict: 'email' }
          );
          
          if (!error) {
            replyMessage = `✅ Parol qabul qilindi!\n\nSiz tizimga avtomatik tarzda admin sifatida qo'shildingiz. Endi barcha yangi buyurtmalar to'g'ridan-to'g'ri shu bot orqali sizga keladi! Hech qanday Vercel sozlamasi shart emas.`;
          } else {
            replyMessage = `❌ Bazaga ulanishda xatolik yuz berdi: ${error.message}`;
          }
        } else {
           replyMessage = `❌ Supabase kalitlari topilmadi.`;
        }
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
