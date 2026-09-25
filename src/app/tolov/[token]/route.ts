import { serverSupabase } from "@/lib/supabase-server";
import { clickPayUrl, clickConfigured } from "@/lib/click-links";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { buildDmOrder, isLinkPreviewBot, isValidDmPayToken } from "@/lib/dm-pay-link";

export const dynamic = "force-dynamic";

function html(body: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta property="og:title" content="ELORE Parfume — Click orqali to'lov"><title>ELORE Parfume — to'lov</title></head><body style="font-family:system-ui,sans-serif;background:#0b0b0b;color:#eee;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:16px;text-align:center"><div>${body}</div></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } }
  );
}

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isValidDmPayToken(token)) return html("<p>Sahifa topilmadi.</p>", 404);

  if (isLinkPreviewBot(req.headers.get("user-agent") || "")) {
    return html("<p>ELORE Parfume — Click orqali to'lov</p>");
  }

  if (!rateLimit(`dm-pay:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return html("<p>Juda ko'p urinish. Iltimos, 10 daqiqadan keyin qayta oching.</p>", 429);
  }

  if (!clickConfigured()) {
    console.error("[tolov] NEXT_PUBLIC_CLICK_* kalitlari sozlanmagan");
    return html("<p>To'lov vaqtincha ishlamayapti. Iltimos, sotuvchiga yozing.</p>", 503);
  }

  const order = buildDmOrder();
  const { data, error } = await serverSupabase().from("orders").insert(order).select("id").single();
  if (error || !data) {
    console.error("[tolov] buyurtma yaratilmadi", error);
    return html("<p>To'lovni boshlab bo'lmadi. Iltimos, qayta urinib ko'ring yoki sotuvchiga yozing.</p>", 500);
  }

  return Response.redirect(clickPayUrl({ amountUzs: order.total_amount, orderId: data.id }), 302);
}
