import { NextResponse } from "next/server";
import { recoverAlifCheckout, refreshAlifCheckout } from "@/lib/alif-checkout";
import { guardAlif, alifErrorResponse, ALIF_HEADERS } from "@/lib/alif-api";
import { readCookie } from "@/lib/cookies";
import { AlifError } from "@/lib/alifpay";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    const denied = await guardAlif(req, "status"); if (denied) return denied;
    const input = await req.json();
    if (typeof input?.order_id !== "string") throw new AlifError("Buyurtma havolasi yaroqsiz", 400);
    const token = input.recovery_token || readCookie(req.headers.get("cookie"), `alif_${input.order_id}`) || "";
    await recoverAlifCheckout(input.order_id, token, typeof input.recovery_receipt === "string" ? input.recovery_receipt : undefined);
    return NextResponse.json(await refreshAlifCheckout(input.order_id), { headers: ALIF_HEADERS });
  } catch (error) { return alifErrorResponse(error); }
}
