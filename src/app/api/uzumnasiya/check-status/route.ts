import { NextResponse } from "next/server";
import { checkBuyerStatus } from "@/lib/uzumnasiya";

/**
 * 1-bosqich: foydalanuvchi statusi.
 * Kutadi: { phone: "998XXXXXXXXX" | number }
 * Qaytaradi: Uzum data (status kodi, user_id, limit).
 */
export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    const digits = Number(String(phone).replace(/\D/g, ""));
    if (!digits || String(digits).length !== 12) {
      return NextResponse.json(
        { error: "Telefon 998XXXXXXXXX (12 raqam) formatda bo'lishi kerak" },
        { status: 400 }
      );
    }
    const res = await checkBuyerStatus(digits);
    return NextResponse.json({ success: true, data: res.data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
