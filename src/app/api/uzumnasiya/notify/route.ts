import { NextResponse } from "next/server";
import { checkoutStore } from "@/lib/uzum-checkout-store";
import { finishCheckout } from "@/lib/uzum-checkout-server";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const maxDuration = 90;

/** Compatibility endpoint: notification content comes exclusively from the server order. */
export async function POST(req: Request) {
  if (!rateLimit(`ntf:${clientIp(req)}`, 20, 10 * 60 * 1000)) return NextResponse.json({ error: "Juda ko'p urinish" }, { status: 429 });
  try {
    const { contract_id } = await req.json();
    if (!Number.isSafeInteger(contract_id) || contract_id <= 0) return NextResponse.json({ error: "contract_id majburiy" }, { status: 400 });
    const row = await checkoutStore.byContract(contract_id);
    if (!row) return NextResponse.json({ error: "Buyurtma topilmadi" }, { status: 404 });
    const result = await finishCheckout(row.id, true);
    return NextResponse.json({ ok: result.state === "signed", state: result.state });
  } catch {
    return NextResponse.json({ error: "Buyurtmani tekshirib bo'lmadi" }, { status: 503 });
  }
}
