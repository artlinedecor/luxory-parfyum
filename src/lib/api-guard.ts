import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

/**
 * API route'lar uchun himoya qatlami.
 *
 * ⚠️ Next hujjati: proxy to'liq autorizatsiya yechimi emas. Maxfiy
 * route SHU yerdagi funksiyani O'ZI chaqirishi shart.
 */

/**
 * Admin bo'lmagan so'rovni to'xtatadi.
 * @returns null — ruxsat berildi; Response — rad etildi
 */
export async function requireAdmin(req: Request): Promise<Response | null> {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(`(?:^|;\s*)${ADMIN_COOKIE}=([^;]+)`));
  const session = await verifySessionToken(m?.[1]);
  if (!session) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }
  return null;
}

/**
 * Faqat bizning server tomonimizdan chaqiriladigan route'lar uchun.
 * Chaqiruvchi `x-internal-secret` headerini qo'shishi kerak.
 */
export function requireInternalSecret(req: Request): Response | null {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) {
    console.error("[api-guard] INTERNAL_API_SECRET sozlanmagan");
    return NextResponse.json({ error: "Tizim sozlanmagan" }, { status: 503 });
  }
  if (req.headers.get("x-internal-secret") !== expected) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }
  return null;
}

/** Ichki chaqiruvlar uchun header — `fetch` ga qo'shiladi. */
export function internalHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
  };
}
