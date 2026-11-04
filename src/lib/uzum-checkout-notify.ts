import { serverSupabase } from "./supabase-server";
import { getAdminChatIds, sendTelegram } from "./telegram";
import { formatUzs } from "./utils";
import type { CheckoutOrder, UzumCheckoutMeta } from "./uzum-checkout-store";
import { canClaimNotification } from "./uzum-reconciliation";

const escape = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Atomic claim prevents browser recovery and webhook from notifying simultaneously. */
export async function notifyUzumCheckout(order: CheckoutOrder, meta: UzumCheckoutMeta) {
  if (!canClaimNotification(meta) || !meta.contract_id) return;
  const db = serverSupabase();
  const stamp = Date.now();
  const items = order.items.map((line, i) => i === 0 ? { ...line, uzum_checkout: { ...meta, notification: "sending", notification_claimed_at: stamp } } : line);
  let claim = db.from("orders").update({ items }).eq("id", order.id)
    .eq("items->0->uzum_checkout->>notification", meta.notification);
  if (meta.notification === "sending") claim = meta.notification_claimed_at
    ? claim.eq("items->0->uzum_checkout->>notification_claimed_at", String(meta.notification_claimed_at))
    : claim.is("items->0->uzum_checkout->>notification_claimed_at", null);
  const claimed = await claim.select("id").maybeSingle();
  if (claimed.error) { console.error("[uzum/notify] claim failed", claimed.error.message); return; }
  if (!claimed.data) return;
  let delivered = false;
  try {
    const admins = await getAdminChatIds();
    const lines = order.items.map(i => `• ${escape(i.title)} × ${i.quantity} — ${formatUzs(i.price_uzs)} so'm`).join("\n");
    const text = `💳 <b>YANGI BUYURTMA — Uzum Nasiya</b>\nShartnoma imzolangan\n\n` +
      `👤 ${escape(order.client_name)}\n📞 ${escape(order.client_phone)}\n📍 ${escape(order.region)} ${escape(order.client_address)}\n\n` +
      `${lines}\n\n💰 Tovarlar: ${formatUzs(order.total_amount)} so'm\n💳 Shartnoma jami: ${formatUzs(meta.quoted_total)} so'm\n` +
      `📅 ${escape(meta.period)}\n🔖 <code>${meta.contract_id}</code>\nBuyurtma: <code>${order.id}</code>`;
    const buttons = order.payment_status === "paid" ? undefined : [[
      { text: "✅ Tasdiqlash", callback_data: `uzok_${meta.contract_id}` },
      { text: "❌ Bekor qilish", callback_data: `uzno_${meta.uzum_order_id}` },
    ]];
    for (const admin of admins) if (await sendTelegram(admin, text, buttons)) delivered = true;
  } catch (error) { console.error("[uzum/notify] failed", error instanceof Error ? error.message : "unknown"); }
  const released = await db.from("orders").update({ items: order.items.map((line, i) => i === 0
    ? { ...line, uzum_checkout: { ...meta, notification: delivered ? "sent" : "pending" } } : line) })
    .eq("id", order.id).eq("items->0->uzum_checkout->>notification", "sending")
    .eq("items->0->uzum_checkout->>notification_claimed_at", String(stamp));
  if (released.error) console.error("[uzum/notify] save failed", released.error.message);
}
