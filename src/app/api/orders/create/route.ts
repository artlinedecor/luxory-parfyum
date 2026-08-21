import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeOrderTotal } from "@/lib/pricing-server";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Buyurtma yaratish — YAGONA server nuqtasi.
 *
 * ⚠️ Audit P1: oldin savat sahifasi anon kalit bilan to'g'ridan-to'g'ri
 * Supabase'ga yozardi va `total_amount` ni o'zi hisoblardi.
 *
 * ⚠️ Audit D3: DB xatosi endi YUTILMAYDI. Oldin xato bo'lsa ham oqim
 * davom etib, xayoliy UUID yasalardi — mijoz to'lardi, buyurtma yo'q edi.
 */
export async function POST(req: Request) {
  try {
    if (!rateLimit(`ord:${clientIp(req)}`, 15, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Juda ko'p urinish. Birozdan keyin qayta urining." },
        { status: 429 }
      );
    }

    const { items, client, order_type } = (await req.json()) as {
      items?: { product_id: string; quantity: number }[];
      client?: { name?: string; phone?: string; address?: string; region?: string };
      order_type?: string;
    };

    if (!items?.length) {
      return NextResponse.json({ error: "Savat bo'sh" }, { status: 400 });
    }
    if (!client?.name?.trim() || !client?.phone?.trim()) {
      return NextResponse.json(
        { error: "Ism va telefon raqam majburiy" },
        { status: 400 }
      );
    }

    // Mijozdan FAQAT product_id va miqdor olinadi.
    const { lines, totalUzs } = await computeOrderTotal(
      items.map((i) => ({ product_id: i.product_id, quantity: i.quantity }))
    );

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from("orders")
      .insert({
        items: lines,
        client_name: client.name,
        client_phone: client.phone,
        region: client.region || client.address || "",
        order_type: order_type || "full_payment",
        status: "pending",
        payment_status: "unpaid",
        total_amount: totalUzs,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[orders/create] insert xatosi", error);
      return NextResponse.json(
        { error: "Buyurtmani saqlab bo'lmadi. Iltimos, qayta urinib ko'ring." },
        { status: 500 }
      );
    }

    return NextResponse.json({ order_id: data.id, total_uzs: totalUzs, lines });
  } catch (e) {
    console.error("[orders/create]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
