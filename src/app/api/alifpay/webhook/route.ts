import { NextResponse } from "next/server";
import { alifStore } from "@/lib/alif-checkout-store";
import { alifMeta, refreshAlifCheckout } from "@/lib/alif-checkout";
import { alifConfig, AlifError, verifyAlifSignature } from "@/lib/alifpay";
import { ALIF_HEADERS, alifErrorResponse } from "@/lib/alif-api";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("order_id") || "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new AlifError("Invalid order", 400);
    const row = await alifStore.get(id);
    if (!row) throw new AlifError("Unknown order", 404);
    if (Number(req.headers.get("content-length")) > 65536) throw new AlifError("Body too large", 413);
    const raw = new Uint8Array(await req.arrayBuffer());
    if (raw.length > 65536) throw new AlifError("Body too large", 413);
    if (!verifyAlifSignature(raw, req.headers.get("signature"), alifConfig(alifMeta(row).mode).secret)) throw new AlifError("Invalid signature", 401);
    // Do not trust webhook payment fields. The query binds our saved order and
    // getInvoice verifies provider identity, amount and metadata before persistence.
    await refreshAlifCheckout(id);
    return NextResponse.json({ ok: true }, { headers: ALIF_HEADERS });
  } catch (error) { return alifErrorResponse(error); } // Non-200 makes Alif retry failed durable processing.
}
