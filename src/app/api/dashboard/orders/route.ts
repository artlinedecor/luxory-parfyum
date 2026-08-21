import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guard";
import { serverSupabase } from "@/lib/supabase-server";
import { computeOrderTotal } from "@/lib/pricing-server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Buyurtma amallari — butun biznes mantiq SERVER tomonda.
 *
 * Oldin bularning hammasi brauzerda, ommaviy kalit bilan bajarilardi va
 * "yetkazildi" o'tishi mantiqi ikki joyda takrorlangan edi (audit X7).
 *
 * Tuzatilgan xatolar:
 *   P8 — kassaga daromad SO'MDA yoziladi. Oldin `price_at_purchase`
 *        (dollar) yig'indisi so'm sifatida yozilardi: 800 000 so'mlik
 *        sotuv kassaga ~30 bo'lib tushardi.
 *   D5 — DB xatolari endi yutilmaydi, mijozga qaytariladi.
 */

type OrderItem = { product_id: string; quantity: number; price_uzs?: number; price_at_purchase?: number };
type OrderRow = { id: string; status: string; items: OrderItem[] | null; total_amount: number | null };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Buyurtmaning so'mdagi summasi — yagona manba. */
function orderTotalUzs(order: OrderRow): number {
  if (order.total_amount != null && Number(order.total_amount) > 0) {
    return Number(order.total_amount);
  }
  // Eski buyurtmalar: qatorlardan price_uzs bo'yicha yig'amiz.
  const items = order.items ?? [];
  const sum = items.reduce((s, i) => s + Number(i.price_uzs || 0) * Number(i.quantity || 0), 0);
  if (sum > 0) return sum;
  // Na total_amount, na price_uzs bor — eski dollar yozuvi. 0 yozamiz va
  // ogohlantiramiz: noto'g'ri valyutani kassaga qo'shgandan ko'ra yaxshi.
  console.warn("[dashboard/orders] summani aniqlab bo'lmadi", { id: order.id });
  return 0;
}

async function shiftStock(
  supabase: SupabaseClient,
  items: OrderItem[],
  direction: -1 | 1
): Promise<void> {
  for (const item of items) {
    if (!UUID_RE.test(String(item.product_id))) continue;
    const { data: prod, error } = await supabase
      .from("products").select("stock").eq("id", item.product_id).single();
    if (error || !prod) {
      console.warn("[dashboard/orders] stok o'qilmadi", item.product_id, error?.message);
      continue;
    }
    const current = prod.stock ?? 10;
    const next = Math.max(0, current + direction * Number(item.quantity || 0));
    const { error: uErr } = await supabase
      .from("products").update({ stock: next }).eq("id", item.product_id);
    if (uErr) console.warn("[dashboard/orders] stok yozilmadi", item.product_id, uErr.message);
  }
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { action } = body as { action: string };
    const supabase = serverSupabase();

    // ── Holatni o'zgartirish ────────────────────────────────────────
    if (action === "status") {
      const { order_id, status } = body as { order_id: string; status: string };
      if (!order_id || !status) throw new Error("order_id va status majburiy");

      const { data: order, error } = await supabase
        .from("orders").select("*").eq("id", order_id).single();
      if (error || !order) throw new Error("Buyurtma topilmadi");

      const o = order as OrderRow;
      const items = o.items ?? [];
      const wasDelivered = o.status === "delivered";
      const willDeliver = status === "delivered";

      if (willDeliver && !wasDelivered) {
        await shiftStock(supabase, items, -1);
        const { error: tErr } = await supabase.from("transactions").insert({
          type: "income",
          amount: orderTotalUzs(o),
          description: `Buyurtma #${order_id.slice(0, 8)} yetkazildi - Daromad`,
        });
        if (tErr) throw new Error(`Daromad yozilmadi: ${tErr.message}`);
      } else if (!willDeliver && wasDelivered) {
        await shiftStock(supabase, items, 1);
        const { error: dErr } = await supabase
          .from("transactions").delete()
          .like("description", `%Buyurtma #${order_id.slice(0, 8)}%`);
        if (dErr) throw new Error(`Daromad yozuvi o'chirilmadi: ${dErr.message}`);
      }

      const { error: uErr } = await supabase
        .from("orders").update({ status }).eq("id", order_id);
      if (uErr) throw new Error(`Holat yangilanmadi: ${uErr.message}`);

      return NextResponse.json({ ok: true });
    }

    // ── O'chirish ───────────────────────────────────────────────────
    if (action === "delete") {
      const { order_id } = body as { order_id: string };
      if (!order_id) throw new Error("order_id majburiy");

      const { error: oErr } = await supabase.from("orders").delete().eq("id", order_id);
      if (oErr) throw new Error(`Buyurtma o'chirilmadi: ${oErr.message}`);

      const { error: tErr } = await supabase
        .from("transactions").delete()
        .like("description", `%Buyurtma #${order_id.slice(0, 8)}%`);
      if (tErr) console.warn("[dashboard/orders] tranzaksiya o'chirilmadi", tErr.message);

      return NextResponse.json({ ok: true });
    }

    // ── Qo'lda buyurtma yaratish ────────────────────────────────────
    if (action === "create") {
      const { items, client_name, client_phone, status } = body as {
        items: { product_id: string; quantity: number }[];
        client_name: string;
        client_phone: string;
        status?: string;
      };
      if (!items?.length || !client_name?.trim() || !client_phone?.trim()) {
        throw new Error("Mijoz ismi, telefoni va kamida 1 ta mahsulot majburiy");
      }

      // ⚠️ P8: narx do'kondagi bilan BIR XIL formula bo'yicha, so'mda.
      // Oldin bu yerda price_usd (masalan 25) yozilardi va kassa
      // dollar bilan so'mni aralashtirardi.
      const { lines, totalUzs } = await computeOrderTotal(items);

      const orderStatus = status || "pending";
      const { data: created, error } = await supabase.from("orders").insert({
        items: lines,
        client_name,
        client_phone,
        region: "Qo'lda kiritilgan",
        order_type: "full_payment",
        status: orderStatus,
        payment_status: orderStatus === "delivered" ? "paid" : "unpaid",
        total_amount: totalUzs,
      }).select().single();

      if (error || !created) throw new Error(`Buyurtma yaratilmadi: ${error?.message}`);

      if (orderStatus === "delivered") {
        await shiftStock(supabase, lines, -1);
        const { error: tErr } = await supabase.from("transactions").insert({
          type: "income",
          amount: totalUzs,
          description: `Buyurtma #${created.id.slice(0, 8)} yetkazildi (Qo'lda) - Daromad`,
        });
        if (tErr) throw new Error(`Daromad yozilmadi: ${tErr.message}`);
      }

      return NextResponse.json({ order: created, total_uzs: totalUzs, lines });
    }

    throw new Error(`Noma'lum amal: ${action}`);
  } catch (e) {
    console.error("[dashboard/orders]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Xatolik" },
      { status: 400 }
    );
  }
}
