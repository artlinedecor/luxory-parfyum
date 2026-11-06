import { NextResponse } from "next/server";
import { requireAdmin } from "./api-guard";
import { alifConfig, AlifError } from "./alifpay";
import { clientIp, rateLimit } from "./rate-limit";

export const ALIF_HEADERS = { "Cache-Control": "no-store" };
export async function guardAlif(req: Request, action: "config" | "create" | "status") {
  const config = alifConfig();
  // Test payments must never be offered to real shoppers on a deployed site.
  if (config.mode === "sandbox" && process.env.NODE_ENV === "production") {
    const denied = await requireAdmin(req);
    if (denied) return denied;
  }
  if (action !== "config") {
    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403, headers: ALIF_HEADERS });
    if (!rateLimit(`alif-${action}:${clientIp(req)}`, action === "create" ? 12 : 60, 600000)) {
      return NextResponse.json({ error: "Juda ko'p urinish. Keyinroq tekshiring." }, { status: 429, headers: ALIF_HEADERS });
    }
  }
  return null;
}
export function alifErrorResponse(error: unknown) {
  return NextResponse.json({ error: error instanceof AlifError ? error.message : "Alif buyurtmasini tekshirib bo'lmadi. Qayta tekshiring.",
    recovery_receipt: error instanceof AlifError ? error.recoveryReceipt : undefined,
    attempt_not_created: error instanceof AlifError && error.attemptNotCreated },
  { status: error instanceof AlifError ? error.status : 503, headers: ALIF_HEADERS });
}
