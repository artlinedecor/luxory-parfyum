import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { formatUzs } from "@/lib/utils";
import { checkContractStatus } from "@/lib/uzumnasiya";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Uzum Nasiya Webhook received:", JSON.stringify(body));

    // Handle various field structures sent by Uzum Nasiya / Paymart webhooks
    const extOrderId = body.ext_order_id || body.order_id || body.data?.ext_order_id || body.data?.order_id;
    const contractId = body.contract_id || body.data?.contract_id || body.data?.paymart_client?.contract_id;
    const status = (body.status || body.data?.status || body.event || "").toUpperCase();

    if (!extOrderId && !contractId) {
      return NextResponse.json({ error: "Missing ext_order_id or contract_id" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Find the corresponding order
    let orderQuery = supabase.from("orders").select("*");
    if (extOrderId) {
      orderQuery = orderQuery.eq("id", extOrderId);
    }

    const { data: order, error: orderError } = await orderQuery.maybeSingle();

    if (orderError || !order) {
      console.warn("Order not found for Uzum webhook:", { extOrderId, contractId });
      return NextResponse.json({ status: "order_not_found" }, { status: 200 });
    }

    // ⚠️ Audit P7: idempotentlik. Bir xil webhook necha marta kelsa,
    // shuncha marta Telegram xabari ketardi va admin bitta buyurtmani
    // bir necha marta jo'natishi mumkin edi.
    if (order.payment_status === "paid") {
      return NextResponse.json({ status: "already_processed" }, { status: 200 });
    }

    // ⚠️ Audit X3: webhook BODY'SIGA ISHONMAYMIZ.
    // Bu route ochiq va imzo tekshirilmasdi — mijoz o'z order_id sini
    // biladi (callback URL va localStorage'da) va
    //   POST {ext_order_id:<uuid>, status:'PAID'}
    // yuborib, bir tiyin to'lamasdan buyurtmani 'paid' qila olardi.
    //
    // Endi webhook faqat "borib tekshir" signali: haqiqiy holat Uzum
    // Partner API dan so'raladi. Uzum kelgusida imzo mexanizmini bersa,
    // uni qo'shimcha qatlam sifatida qo'shish mumkin — bu tekshiruv
    // baribir kerak bo'lib qoladi.
    let isPaid = false;
    let isCancelled = false;
    if (contractId) {
      try {
        const chk = await checkContractStatus(Number(contractId));
        const cs = Number(chk.data?.contract_status);
        isPaid = cs === 1; // CONTRACT_STATUS.ACTIVE
        isCancelled = cs === 5; // CONTRACT_STATUS.CANCELLED
      } catch (e) {
        console.error("[uzum/webhook] shartnoma holatini tekshirib bo'lmadi", e);
        // 502 qaytaramiz — Uzum webhook'ni qayta yuboradi.
        return NextResponse.json({ status: "verify_failed" }, { status: 502 });
      }
    } else {
      console.warn("[uzum/webhook] contract_id yo'q — tasdiqlab bo'lmaydi", { extOrderId });
      return NextResponse.json({ status: "contract_id_required" }, { status: 400 });
    }

    const newPaymentStatus = isPaid ? "paid" : isCancelled ? "cancelled" : "pending";

    // 3. Update order in database
    await supabase
      .from("orders")
      .update({
        payment_status: newPaymentStatus,
        status: isPaid ? "processing" : order.status,
      })
      .eq("id", order.id);

    // 4. Send Telegram notification to admins upon successful confirmation
    if (isPaid) {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const staticChatId = process.env.TELEGRAM_CHAT_ID;

      if (token) {
        let chatIds = (staticChatId || "").split(",").map((id) => id.trim()).filter(Boolean);

        // Fetch dynamic admin chat IDs from Supabase
        const { data: adminUsers } = await supabase
          .from("users")
          .select("email")
          .eq("role", "superadmin")
          .like("email", "%@telegram.bot");

        if (adminUsers) {
          const dynamicIds = adminUsers.map((u: { email: string }) => u.email.split("@")[0]);
          chatIds = [...new Set([...chatIds, ...dynamicIds])];
        }

        const itemsList = Array.isArray(order.items)
          ? order.items
              .map(
                (item: any) =>
                  `- ${item.title || item.name} x${item.quantity || 1} — ${formatUzs(item.price_uzs || 0)} so'm`
              )
              .join("\n")
          : "Mahsulotlar ko'rsatilmagan";

        const message =
`🟣 YANGI BUYURTMA (UZUM NASIYA)!
👤 Mijoz: ${order.client_name || "Mijoz"}
📞 Telefon: ${order.client_phone}
📍 Manzil: ${order.region || "Ko'rsatilmagan"}

📦 Mahsulotlar:
${itemsList}

💰 Jami summa: ${formatUzs(order.total_amount || 0)} so'm
💳 To'lov turi: Uzum Nasiya (Muddatli to'lov)
📄 Shartnoma ID: ${contractId || "Mavjud emas"}
✅ To'lov holati: Tasdiqlandi (Paid)`;

        for (const chatId of chatIds) {
          try {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, text: message }),
            });
          } catch (e) {
            console.error("Failed to send Telegram message to:", chatId, e);
          }
        }
      }
    }

    return NextResponse.json({ status: "ok", message: "Webhook processed successfully" });
  } catch (error: any) {
    console.error("Uzum Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
