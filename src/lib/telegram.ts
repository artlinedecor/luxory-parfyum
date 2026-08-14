import { createClient } from "@supabase/supabase-js";

const API = (m: string) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${m}`;

/** Env + Supabase'dagi superadmin chat ID lari */
export async function getAdminChatIds(): Promise<string[]> {
  let ids = (process.env.TELEGRAM_CHAT_ID || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
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

export async function sendTelegram(
  chatId: string,
  text: string,
  buttons?: InlineButton[][]
) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  await fetch(API("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
    }),
  });
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
  await fetch(API("answerCallbackQuery"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: id, text, show_alert: false }),
  });
}
