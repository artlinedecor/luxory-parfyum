import { NextRequest, NextResponse } from "next/server";
import {
  answerCallback,
  editTelegramMessage,
  getAdminChatIds,
} from "@/lib/telegram";
import { confirmContract, cancelContract, uzumErrorPayload } from "@/lib/uzumnasiya";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return NextResponse.json({ ok: true });

    // ── Uzum shartnomasi tugmalari ────────────────────────────────────
    if (data.callback_query) {
      const cq = data.callback_query;
      const cbId: string = cq.id;
      const chatId = cq.message?.chat?.id;
      const messageId = cq.message?.message_id;
      const cbData: string = cq.data || "";
      const fromId = String(cq.from?.id || "");

      // ⚠️ Webhook manzili ochiq — faqat admin chat'lari tugmani bosa oladi
      const admins = await getAdminChatIds();
      if (admins.length > 0 && !admins.includes(fromId) && !admins.includes(String(chatId))) {
        await answerCallback(cbId, "Ruxsat yo'q");
        return NextResponse.json({ ok: true });
      }

      const m = cbData.match(/^uz(ok|no)_(\d+)$/);
      if (!m) {
        await answerCallback(cbId);
        return NextResponse.json({ ok: true });
      }

      const isConfirm = m[1] === "ok";
      const id = Number(m[2]);
      const oldText: string = cq.message?.text || "";

      try {
        // confirm -> contract_id, cancel -> order (Uzum shunday talab qiladi)
        if (isConfirm) await confirmContract(id);
        else await cancelContract(id);

        await answerCallback(cbId, isConfirm ? "Tasdiqlandi ✅" : "Bekor qilindi");
        if (chatId && messageId) {
          await editTelegramMessage(
            chatId,
            messageId,
            oldText +
              `\n\n${isConfirm ? "✅ <b>TASDIQLANDI</b> — shartnoma aktiv, tovarni berish mumkin." : "❌ <b>BEKOR QILINDI</b>"}`
          );
        }
      } catch (e) {
        const { body } = uzumErrorPayload(e);
        await answerCallback(cbId, body.error.slice(0, 190));
        if (chatId && messageId) {
          await editTelegramMessage(
            chatId,
            messageId,
            oldText + `\n\n⚠️ Xatolik: ${body.error}`
          );
        }
      }
      return NextResponse.json({ ok: true });
    }

    // ── Oddiy xabarlar (admin Chat ID olish) ──────────────────────────
    if (data.message && data.message.text) {
      const chatId = data.message.chat.id;
      const text = data.message.text.trim();
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
        body: JSON.stringify({ chat_id: chatId, text: replyMessage }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
