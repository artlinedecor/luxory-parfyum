import { NextResponse } from "next/server";
import { startAlifCheckout, authorizeAlifCheckout, type AlifStartInput } from "@/lib/alif-checkout";
import { guardAlif, alifErrorResponse, ALIF_HEADERS } from "@/lib/alif-api";
import { AlifError } from "@/lib/alifpay";
import { alifStore } from "@/lib/alif-checkout-store";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: Request) {
  let input: AlifStartInput | undefined;
  try {
    const denied = await guardAlif(req, "create"); if (denied) return denied;
    input = await req.json();
    const result = await startAlifCheckout(input!);
    const response = NextResponse.json(result, { headers: ALIF_HEADERS });
    setCookie(response, input!);
    return response;
  } catch (error) {
    // Only definitive validation failures with no persisted attempt may release
    // the browser's retry identity. Never release it after provider/DB timeouts.
    if (error instanceof AlifError && error.status === 400 && input?.request_id) {
      try { if (!await alifStore.get(input.request_id)) error.attemptNotCreated = true; } catch { /* uncertain: retain identity */ }
    }
    const response = alifErrorResponse(error);
    if (input?.request_id && input?.recovery_token) {
      try { await authorizeAlifCheckout(input.request_id, input.recovery_token); setCookie(response, input); } catch { /* no authorized saved attempt */ }
    }
    return response;
  }
}
function setCookie(response: NextResponse, input: AlifStartInput) {
  response.cookies.set(`alif_${input.request_id}`, input.recovery_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 86400 });
}
