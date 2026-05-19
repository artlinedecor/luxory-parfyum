import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const adminEmail = process.env.ADMIN_EMAIL || "mamatkuloff@bk.ru";
    const adminPassword = process.env.ADMIN_PASSWORD || "umar2016";

    if (email === adminEmail && password === adminPassword) {
      const response = NextResponse.json({ success: true });
      
      // Set httpOnly cookie for secure server-side verification
      response.cookies.set("admin_session", "authenticated", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 1 day
      });

      // Set client-readable cookie for UI checks
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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
