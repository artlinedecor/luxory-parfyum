import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, createSessionToken } from "@/lib/admin-session";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Brute-force'ga qarshi: bir IP dan 15 daqiqada 10 ta urinish.
    if (!rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, message: "Juda ko'p urinish. 15 daqiqadan keyin qayta urining." },
        { status: 429 }
      );
    }

    const { email, password } = await req.json();

    // ⚠️ Kodda default parol BO'LMAYDI (audit X2). Oldin bu yerda
    // qattiq yozilgan email/parol turardi va env sozlanmagan
    // bo'lsa o'sha ochiq parol bilan kirish mumkin edi.
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      console.error("[auth] ADMIN_EMAIL yoki ADMIN_PASSWORD sozlanmagan");
      return NextResponse.json(
        { success: false, message: "Tizim sozlanmagan. Administratorga murojaat qiling." },
        { status: 503 }
      );
    }

    if (email === adminEmail && password === adminPassword) {
      const response = NextResponse.json({ success: true });

      // Imzolangan sessiya tokeni — qalbakilashtirib bo'lmaydi.
      response.cookies.set(ADMIN_COOKIE, await createSessionToken(adminEmail), {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24,
      });

      // UI uchun o'qiladigan belgi (maxfiy ma'lumot emas).
      response.cookies.set("admin_logged_in", "true", {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: "Noto'g'ri email yoki parol!" },
      { status: 401 }
    );
  } catch (error) {
    console.error("[auth/login]", error);
    return NextResponse.json({ success: false, message: "Xatolik yuz berdi" }, { status: 500 });
  }
}
