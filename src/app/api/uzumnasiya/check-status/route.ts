import { NextResponse } from "next/server";
import { checkBuyerStatus, uzumErrorPayload } from "@/lib/uzumnasiya";

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

    // Diagnostika: mijoz "tarif yoq" ga urilganda sababni Vercel loglaridan
    // topish uchun. Raqam maskalanadi (oxirgi 4 raqam).
    const d = res.data;
    console.log("[uzum/check-status]", {
      phone: "***" + String(digits).slice(-4),
      status: d?.status,
      has_limit: d?.has_limit,
      balance: d?.balance,
      is_in_black_list: d?.is_in_black_list,
      has_overdue_contracts: d?.has_overdue_contracts,
      has_webview: Boolean(d?.webview),
      available_periods: d?.available_periods?.length ?? 0,
    });

    return NextResponse.json({ success: true, data: res.data });
  } catch (error) {
    const { body, status } = uzumErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
