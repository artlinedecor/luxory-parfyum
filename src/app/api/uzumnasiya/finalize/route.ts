import { NextResponse } from "next/server";
import { authorizeCheckout, repairCheckout, finishCheckout, CheckoutError, UZUM_CHECKOUT_COOKIE } from "@/lib/uzum-checkout-server";
import { readCookie } from "@/lib/cookies";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const maxDuration = 90;
const headers = { "Cache-Control": "no-store" };

export async function POST(req: Request) {
  if (!rateLimit(`fin:${clientIp(req)}`, 40, 10 * 60 * 1000)) return NextResponse.json({ error: "Juda ko'p urinish" }, { status: 429, headers });
  try {
    const body = await req.json();
    let saved: { id?: string; token?: string } = {};
    try { saved = JSON.parse(decodeURIComponent(readCookie(req.headers.get("cookie"), UZUM_CHECKOUT_COOKIE) || "{}")); } catch { /* invalid cookie */ }
    const id = body.order_id || body.order_row_id || saved.id;
    const token = body.recovery_token || (saved.id === id ? saved.token : undefined);
    if (!id) {
      if (body.contract_id) throw new CheckoutError("Eski shartnomani do'kon bilan tekshiring. Yangi shartnoma ochishga shoshilmang.");
      return NextResponse.json({ state: "none" }, { headers });
    }
    const order = await authorizeCheckout(id, token);
    await repairCheckout(order, body.recovery_receipt);
    return NextResponse.json(await finishCheckout(id), { headers });
  } catch (error) {
    console.error("[uzum/finalize]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: error instanceof CheckoutError ? error.message : "Buyurtma holatini hozir tekshirib bo'lmadi. Ma'lumot serverda saqlangan; qayta tekshiring." },
      { status: error instanceof CheckoutError ? error.status : 503, headers });
  }
}
