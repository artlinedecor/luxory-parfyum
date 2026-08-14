import { NextResponse } from "next/server";
import { getAdminChatIds, sendTelegram } from "@/lib/telegram";
import { formatUzs } from "@/lib/utils";

/**
 * Imzolangan Uzum Nasiya buyurtmasini Telegram'ga yuboradi —
 * "Tasdiqlash" / "Bekor qilish" tugmalari bilan.
 *
 * Tugmalar telegram-webhook orqali Uzum API'ga ulanadi:
 *   uzok_<contract_id>  -> contracts/confirm
 *   uzno_<order>        -> contracts/cancel  (cancel 'order' id talab qiladi)
 */
export async function POST(req: Request) {
  try {
    const { contract_id, order, client, items, total, period } = (await req.json()) as {
      contract_id: number;
      order: number;
      period?: string;
      total?: number;
      client?: { name?: string; phone?: string; address?: string; region?: string };
      items?: { title: string; quantity: number; price: number }[];
    };

    if (!contract_id) {
      return NextResponse.json({ error: "contract_id majburiy" }, { status: 400 });
    }

    const lines = (items || [])
      .map((i) => `• ${i.title} × ${i.quantity} — ${formatUzs(i.price)} so'm`)
      .join("\n");

    const text =
      `💳 <b>YANGI BUYURTMA — Uzum Nasiya</b>\n` +
      `<i>Shartnoma imzolandi, tasdiqlashingizni kutmoqda</i>\n\n` +
      `👤 ${client?.name || "—"}\n` +
      `📞 ${client?.phone || "—"}\n` +
      `📍 ${client?.region || ""} ${client?.address || ""}\n\n` +
      `📦 <b>Mahsulotlar:</b>\n${lines || "—"}\n\n` +
      `💰 Jami: <b>${formatUzs(Number(total) || 0)} so'm</b>\n` +
      `📅 Muddat: ${period || "—"}\n` +
      `🔖 Shartnoma: <code>${contract_id}</code>\n\n` +
      `⚠️ Omborda tovar borligini tekshirib tasdiqlang.`;

    const buttons = [
      [
        { text: "✅ Tasdiqlash", callback_data: `uzok_${contract_id}` },
        { text: "❌ Bekor qilish", callback_data: `uzno_${order || contract_id}` },
      ],
    ];

    const ids = await getAdminChatIds();
    for (const id of ids) await sendTelegram(id, text, buttons);

    return NextResponse.json({ ok: true, sent: ids.length });
  } catch (error) {
    console.error("Uzum telegram notify error:", error);
    return NextResponse.json({ ok: true, error: "notify_failed" });
  }
}
