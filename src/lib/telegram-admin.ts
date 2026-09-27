import { serverSupabase } from "@/lib/supabase-server";

/**
 * Adminlarga Telegram xabari — buyurtma xabari bilan bir xil qabul qiluvchilar:
 * TELEGRAM_CHAT_ID (vergul bilan) + bazadagi superadmin'lar (<chat_id>@telegram.bot).
 */
export async function sendAdminTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  let chatIds = (process.env.TELEGRAM_CHAT_ID || "").split(",").map((id) => id.trim()).filter(Boolean);
  const { data } = await serverSupabase()
    .from("users")
    .select("email")
    .eq("role", "superadmin")
    .like("email", "%@telegram.bot");
  if (data) chatIds = [...new Set([...chatIds, ...data.map((u: { email: string }) => u.email.split("@")[0])])];

  for (const id of chatIds) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: id, text }),
    });
  }
}
