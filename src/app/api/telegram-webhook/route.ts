import { NextRequest, NextResponse } from "next/server";
import {
  answerCallback,
  editTelegramMessage,
  getAdminChatIds,
} from "@/lib/telegram";
import { confirmContract, cancelContract, uzumErrorPayload } from "@/lib/uzumnasiya";

export async function POST(req: NextRequest) {
  try {
    // ⚠️ Audit X5: Telegram setWebhook'da secret_token bergan bo'lsak,
    // har bir so'rovga shu headerni qo'shadi. Busiz body'ni istalgan
    // odam yasab, o'zini admin qilib ko'rsatib tugma bosa olardi.
    const hookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!hookSecret || req.headers.get("x-telegram-bot-api-secret-token") !== hookSecret) {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
    }

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

      // Faqat admin chat'lari tugmani bosa oladi.
      // ⚠️ Bo'sh ro'yxat = HECH KIM, "hamma" EMAS. Oldin shart
      // `admins.length > 0 &&` bilan boshlanardi: TELEGRAM_CHAT_ID bo'sh
      // va DB so'rovi xato bergan holatda (telegram.ts:23 catch bo'sh
      // ro'yxat qaytaradi) tekshiruv BUTUNLAY o'tkazib yuborilardi.
      const admins = await getAdminChatIds();
      if (admins.length === 0 || (!admins.includes(fromId) && !admins.includes(String(chatId)))) {
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
        replyMessage =
          "Assalomu alaykum!\n\nChat ID ni bilish uchun /id yuboring. " +
          "Admin huquqi do'kon egasi tomonidan qo'lda beriladi.";
      // ⚠️ Audit X6: bu yerda qattiq yozilgan parol sharti bor edi —
      // parolni bilgan (yoki git tarixidan o'qigan) har kim `users`
      // jadvaliga superadmin bo'lib yozilardi va BARCHA buyurtmalar
      // (ism, telefon, manzil) uning Telegramiga oqardi.
      //
      // Yangi admin endi faqat Supabase Studio orqali `users` jadvaliga
      // qo'lda qo'shiladi.
      } else if (text === "/id") {
        replyMessage = `Sizning Chat ID: ${chatId}

Admin qilish uchun bu raqamni do'kon egasiga yuboring.`;
      } else {
        replyMessage = "Buyruqlar: /start, /id";
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
