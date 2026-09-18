import { serverSupabase } from "@/lib/supabase-server";

const API = (m: string) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${m}`;

/** Env + Supabase'dagi superadmin chat ID lari */
export async function getAdminChatIds(): Promise<string[]> {
  let ids = (process.env.TELEGRAM_CHAT_ID || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const supabase = serverSupabase();
    const { data } = await supabase
      .from("users")
      .select("email")
      .eq("role", "superadmin")
      .like("email", "%@telegram.bot");
    if (data) ids = [...new Set([...ids, ...data.map((u: { email: string }) => u.email.split("@")[0])])];
  } catch {
    /* baza xatosi bildirishnomani to'xtatmasin */
  }
  return ids;
}

export interface InlineButton {
  text: string;
  callback_data: string;
}

/**
 * ⚠️ Oldin bu funksiya Telegram javobini UMUMAN tekshirmasdi — xato
 * bo'lsa ham (noto'g'ri chat_id, bot bloklangan, HTML parse xatosi...)
 * chaqiruvchi "yuborildi" deb hisoblardi. Natijada "sent: 1" qaytsa
 * ham, xabar aslida hech kimga yetib bormagan bo'lishi mumkin edi —
 * va buni hech kim bilmasdi.
 *
 * Endi Telegram API javobi tekshiriladi va muvaffaqiyatsizlik LOGGA
 * aniq sabab bilan yoziladi (masalan: "chat not found", "bot was
 * blocked by the user").
 */
export async function sendTelegram(
  chatId: string,
  text: string,
  buttons?: InlineButton[][]
): Promise<boolean> {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("[telegram] TELEGRAM_BOT_TOKEN sozlanmagan");
    return false;
  }
  try {
    const res = await fetch(API("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j.ok === false) {
      console.error("[telegram] sendMessage muvaffaqiyatsiz", {
        chatId,
        http: res.status,
        description: j.description,
        error_code: j.error_code,
      });
      return false;
    }
    return true;
  } catch (e) {
    console.error("[telegram] sendMessage tarmoq xatosi", { chatId, error: e });
    return false;
  }
}

/** Tugma bosilgach xabarni yangilash (tugmalarni olib tashlash) */
export async function editTelegramMessage(
  chatId: number | string,
  messageId: number,
  text: string
) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  await fetch(API("editMessageText"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
    }),
  });
}

/** Tugma bosilganda "yuklanmoqda" holatini yopish */
export async function answerCallback(id: string, text?: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  const res = await fetch(API("answerCallbackQuery"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: id, text, show_alert: false }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    console.error("[telegram] answerCallbackQuery muvaffaqiyatsiz", j.description);
  }
}
