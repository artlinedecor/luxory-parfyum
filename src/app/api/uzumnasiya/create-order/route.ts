import { NextResponse } from "next/server";
import { createUzumOrder, UzumProductItem } from "@/lib/uzumnasiya";
import { createClient } from "@supabase/supabase-js";
import { calculateOriginalPriceUzs, calculatePremiumPriceUzs } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { products, period = "12", clientName, clientPhone, clientAddress, clientRegion } = body;

    if (!products || !products.length || !clientPhone) {
      return NextResponse.json(
        { error: "Mahsulotlar yoki mijoz telefon raqami to'liq kiritilmagan" },
        { status: 400 }
      );
    }

    // 1. Sanitize customer phone (e.g. +998901234567 or 998901234567)
    let sanitizedPhone = clientPhone.replace(/\D/g, "");
    if (sanitizedPhone.startsWith("8") && sanitizedPhone.length === 11) {
      sanitizedPhone = "998" + sanitizedPhone.slice(1);
    }
    if (!sanitizedPhone.startsWith("998")) {
      sanitizedPhone = "998" + sanitizedPhone;
    }

    // 2. Map items and calculate prices in UZS
    let totalAmountUzs = 0;
    const orderItems = products.map((item: any) => {
      const priceUzs = item.price_uzs || (item.product_type === "original"
        ? calculateOriginalPriceUzs(item.price_usd || item.price)
        : calculatePremiumPriceUzs(item.price_usd || item.price));
      
      const quantity = item.quantity || 1;
      totalAmountUzs += priceUzs * quantity;

      return {
        product_id: item.id || item.product_id,
        title: item.title || item.name,
        quantity,
        price_usd: item.price_usd || 0,
        price_uzs: priceUzs,
        product_type: item.product_type || "lux_copy",
      };
    });

    const uzumProducts: UzumProductItem[] = orderItems.map((item: any) => ({
      amount: item.quantity,
      name: item.title,
      price: item.price_uzs,
      category: 1,
      unit_id: 1,
      product_id: item.product_id,
    }));

    // 3. Save initial order to Supabase database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fullRegionDisplay = clientRegion ? `${clientRegion} — ${clientAddress || ""}` : (clientAddress || "Ko'rsatilmagan");

    const { data: newOrder, error: dbError } = await supabase
      .from("orders")
      .insert({
        items: orderItems,
        client_name: clientName || "Mijoz (Uzum Nasiya)",
        client_phone: clientPhone,
        client_address: clientAddress || "",
        region: fullRegionDisplay,
        order_type: "uzum_nasiya",
        status: "pending",
        payment_status: "pending",
        total_amount: totalAmountUzs,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Supabase insert order error:", dbError);
    }

    const orderId = newOrder?.id || crypto.randomUUID();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://parfumelux.uz";

    // 4. Check if Uzum token is configured
    if (!process.env.UZUM_PARTNER_TOKEN) {
      return NextResponse.json({
        success: false,
        error: "Uzum Nasiya tokeni (UZUM_PARTNER_TOKEN) hali sozlanmagan. Iltimos Uzum Nasiya API kalitini kiriting.",
        order_id: orderId,
      }, { status: 400 });
    }

    // 5. Call Uzum Nasiya API
    const uzumResponse = await createUzumOrder({
      phone: sanitizedPhone,
      period: String(period),
      ext_order_id: orderId,
      callback: `${siteUrl}/payment-success?order_id=${orderId}&method=uzumnasiya`,
      products: uzumProducts,
    });

    const webviewPath = uzumResponse.data?.webview_path;
    const contractId = uzumResponse.data?.paymart_client?.contract_id;

    return NextResponse.json({
      success: true,
      webview_path: webviewPath,
      contract_id: contractId,
      order_id: orderId,
    });
  } catch (error: any) {
    console.error("Create Uzum Order Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Uzum Nasiya buyurtmasini yaratishda xatolik" },
      { status: 500 }
    );
  }
}
