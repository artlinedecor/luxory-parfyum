import { NextResponse } from "next/server";
import { startCheckout, authorizeCheckout, CheckoutError, UZUM_CHECKOUT_COOKIE, type StartCheckoutInput } from "@/lib/uzum-checkout-server";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const maxDuration = 120;
const headers = { "Cache-Control": "no-store" };

function cookie(response: NextResponse, input: StartCheckoutInput) {
  response.cookies.set(UZUM_CHECKOUT_COOKIE, encodeURIComponent(JSON.stringify({ id: input.request_id, token: input.recovery_token })),
    { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 86400 });
  return response;
}

export async function POST(req: Request) {
  if (!rateLimit(`uz-create:${clientIp(req)}`, 12, 10 * 60 * 1000)) return NextResponse.json({ error: "Juda ko'p urinish. Birozdan keyin qayta tekshiring." }, { status: 429, headers });
  let input: StartCheckoutInput | undefined;
  try {
    input = await req.json();
    const result = await startCheckout(input!);
    return cookie(NextResponse.json(result, { headers }), input!);
  } catch (error) {
    console.error("[uzum/create-order]", error instanceof Error ? error.message : "unknown");
    let recovery_path: string | undefined;
    if (input?.request_id && input?.recovery_token) {
      try {
        await authorizeCheckout(input.request_id, input.recovery_token);
        recovery_path = `/payment-success?uzum_order_id=${input.request_id}`;
      } catch { /* no persisted authorized checkout */ }
    }
    const response = NextResponse.json({ error: error instanceof CheckoutError ? error.message : "Shartnoma ma'lumotini saqlab bo'lmadi. Qayta tekshiring yoki do'kon bilan bog'laning.", recovery_path,
      recovery_receipt: error instanceof CheckoutError ? error.recoveryReceipt : undefined },
      { status: error instanceof CheckoutError ? error.status : 503, headers });
    return recovery_path && input ? cookie(response, input) : response;
  }
}
