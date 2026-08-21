import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

/**
 * Next 16 da bu fayl `middleware.ts` emas, `proxy.ts` deb nomlanadi.
 *
 * ⚠️ Next hujjati (01-app/01-getting-started/16-proxy.md): proxy to'liq
 * autorizatsiya yechimi EMAS, faqat "optimistic check". Maxfiy API
 * route'lar himoyani o'zlari ham tekshirishi shart — @/lib/api-guard.
 */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const session = await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
