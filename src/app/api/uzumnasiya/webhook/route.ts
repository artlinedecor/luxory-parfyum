import { NextResponse } from "next/server";
import { processUzumWebhook, CheckoutError } from "@/lib/uzum-checkout-server";

export const maxDuration = 90;

export async function POST(req: Request) {
  try {
    const result = await processUzumWebhook(await req.json());
    return NextResponse.json({ status: "ok", ...result });
  } catch (error) {
    console.error("[uzum/webhook]", error instanceof Error ? error.message : "unknown");
    // A callback may race the create response. Retry rather than acknowledge a lost order.
    return NextResponse.json({ status: "retry", error: error instanceof CheckoutError ? error.message : "Holat tekshirilmay qoldi" }, { status: 503 });
  }
}
