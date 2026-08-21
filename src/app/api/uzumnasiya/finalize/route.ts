import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase-server";
import { computeOrderTotal } from "@/lib/pricing-server";
import { checkContractStatus } from "@/lib/uzumnasiya";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Imzolangan Uzum shartnomasini buyurtmaga aylantiradi.
 *
 * ⚠️ Audit D1: oldin bu ish BRAUZERDA bajarilardi (uzum-pending.ts).
 * Birinchi insert `uzum_contract_id` ustuniga yozardi — u ustun bazada
 * YO'Q (tekshirildi), ya'ni har doim yiqilardi. Keyin zaxira insert
 * ishlardi, lekin uning xatosi UMUMAN tekshirilmasdi va funksiya hech
 * qachon throw qilmasdi. Natijada: mijoz Uzumda haqiqiy qarz
 * shartnomasini imzolagan, ekranda "qabul qilindi" chiqqan, bazada
 * hech narsa yo'q va localStorage tozalangan — tiklashning imkoni yo'q.
 *
 * ⚠️ Audit X7: brauzerdan `orders` ga yozish RLS bilan ishlamaydi.
 * ⚠️ Audit P2: narx mijozdan emas, bazadan olinadi.
 */
export async function POST(req: Request) {
  try {
    if (!rateLimit(`fin:${clientIp(req)}`, 20, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Juda ko'p urinish" }, { status: 429 });
    }

    const { contract_id, uzum_order, period, client, items } = (await req.json()) as {
      contract_id: number;
      uzum_order?: number;
      period?: string;
      client?: { name?: string; phone?: string; address?: string; region?: string };
      items?: { product_id: string; quantity: number }[];
    };

    if (!contract_id) {
      return NextResponse.json({ error: "contract_id majburiy" }, { status: 400 });
    }
    if (!items?.length || !client?.phone) {
      return NextResponse.json({ error: "Savat yoki telefon to'liq emas" }, { status: 400 });
    }

    const supabase = serverSupabase();

    // ── Idempotentlik: bir shartnoma = bir buyurtma ──────────────
    const { data: existing } = await supabase
      .from("uzum_contracts")
      .select("contract_id, order_row_id")
      .eq("contract_id", contract_id)
      .maybeSingle();

    if (existing?.order_row_id) {
      return NextResponse.json({ order_id: existing.order_row_id, already: true });
    }

    // ── Shartnoma HAQIQATAN imzolanganmi — Uzumdan so'raymiz ─────
    // Mijoz yuborgan ma'lumotga ishonmaymiz.
    const chk = await checkContractStatus(Number(contract_id));
    const cs = Number(chk.data?.contract_status);
    if (cs !== 1 && cs !== 2) {
      return NextResponse.json(
        { error: "Shartnoma imzolanmagan", contract_status: cs },
        { status: 409 }
      );
    }

    // ── Narx bazadan ────────────────────────────────────────────
    const { lines, totalUzs } = await computeOrderTotal(
      items.map((i) => ({ product_id: i.product_id, quantity: i.quantity }))
    );

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        items: lines,
        client_name: client.name || "Mijoz",
        client_phone: client.phone,
        region: `${client.region || ""} — ${client.address || ""}`.trim(),
        order_type: "uzum_nasiya",
        status: "pending",
        payment_status: "pending",
        total_amount: totalUzs,
      })
      .select("id")
      .single();

    // ⚠️ Xato endi YUTILMAYDI — mijoz qarzga qolib, buyurtmasiz
    // qolmasligi uchun bu eng muhim tekshiruv.
    if (error || !order) {
      console.error("[uzum/finalize] buyurtma yozilmadi", { contract_id, error });
      return NextResponse.json(
        { error: "Buyurtmani saqlab bo'lmadi. Do'kon bilan bog'laning." },
        { status: 500 }
      );
    }

    // ── Shartnoma serverda ham qoladi (D4) ──────────────────────
    const { error: cErr } = await supabase.from("uzum_contracts").upsert(
      {
        contract_id,
        order_row_id: order.id,
        uzum_order_id: uzum_order ?? null,
        phone: client.phone,
        total: totalUzs,
        period: period ?? null,
        status: "signed",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "contract_id" }
    );
    if (cErr) console.error("[uzum/finalize] uzum_contracts yozilmadi", cErr);

    return NextResponse.json({ order_id: order.id, total_uzs: totalUzs, lines });
  } catch (e) {
    console.error("[uzum/finalize]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Xatolik" },
      { status: 500 }
    );
  }
}
