import { NextResponse } from "next/server";
import { createUzumOrder } from "@/lib/uzumnasiya";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { products, period, clientPhone } = body;

    if (!products || !products.length || !period) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Map your cart products to Uzum products format
    const uzumProducts = products.map((item: any) => ({
      amount: item.quantity || 1,
      name: item.title,
      price: item.price_usd, // Ensure this is converted to UZS if Uzum requires UZS
      category: 1, // Placeholder category ID
      unit_id: 1, // Placeholder unit ID (pieces)
      product_id: item.id,
    }));

    const extOrderId = crypto.randomUUID();

    // Call Uzum Nasiya API
    const response = await createUzumOrder({
      user_id: 1, // This should be the authenticated user's ID or fetched based on phone
      period: period,
      ext_order_id: extOrderId,
      callback: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?order_id=${extOrderId}`,
      products: uzumProducts,
    });

    if (response.status === "error") {
      throw new Error(response.message || "Uzum Nasiya API Error");
    }

    // TODO: Save the order in your database with status 'pending' and the returned contract_id

    return NextResponse.json({
      success: true,
      webview_path: response.data.webview_path,
      contract_id: response.data.paymart_client.contract_id,
    });
  } catch (error: any) {
    console.error("Create Uzum Order Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
