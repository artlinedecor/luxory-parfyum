import { after, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guard";
import { serverSupabase } from "@/lib/supabase-server";
import { isAbandonedDmOrder } from "@/lib/dm-pay-link";
import { getUsdRate } from "@/lib/usd-rate-server";
import { finishCheckout } from "@/lib/uzum-checkout-server";
import type { CheckoutOrder } from "@/lib/uzum-checkout-store";
import { rateLimit } from "@/lib/rate-limit";
import { reconciliationCandidates } from "@/lib/uzum-reconciliation";
import { isAlifSandboxOrder } from "@/lib/alifpay";

export const maxDuration = 120;

/**
 * Dashboard uchun o'qish — barcha sahifalar shu yerdan ma'lumot oladi.
 * Faqat admin sessiyasi bilan ishlaydi (audit X7).
 */
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const supabase = serverSupabase();
    const [prodRes, ordRes, txRes, ucRes, usdRate] = await Promise.all([
      supabase.from("products").select("*").order("title", { ascending: true }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      // Uzum Nasiya shartnomalari — orders.uzum_contract_id USTUNI YO'Q,
      // shartnoma bog'lanishi shu jadval orqali (order_row_id).
      supabase.from("uzum_contracts").select("*").order("created_at", { ascending: false }),
      getUsdRate(supabase),
    ]);

    // ⚠️ Audit D5: xatolar endi yutilmaydi — oldin dashboard bo'sh
    // ro'yxat ko'rsatib, hech kim sababni bilmasdi.
    const firstError = prodRes.error || ordRes.error || txRes.error;
    if (firstError) {
      console.error("[dashboard/data]", firstError);
      return NextResponse.json(
        { error: `Ma'lumot olishda xatolik: ${firstError.message}` },
        { status: 500 }
      );
    }
    if (ucRes.error) {
      // Bu jadval yo'qligi umumiy dashboard'ni to'xtatmasin — faqat log.
      console.error("[dashboard/data] uzum_contracts", ucRes.error);
    }

    // A buyer need not return from Uzum: the admin view also reconciles saved contracts.
    // Run after the response so opening the dashboard never waits for the bank.
    const linked = new Set<string>((ucRes.data ?? []).filter(c => c.status === "created" || c.status === "signed").map(c => c.order_row_id).filter(Boolean));
    const pendingUzum = reconciliationCandidates((ordRes.data ?? []) as CheckoutOrder[], linked);
    if (pendingUzum.length && rateLimit("uzum-admin-reconcile", 1, 60000)) after(async () => {
      const results = await Promise.allSettled(pendingUzum.map(o => finishCheckout((o as CheckoutOrder).id, true)));
      results.forEach(r => { if (r.status === "rejected") console.error("[uzum/reconcile]", r.reason instanceof Error ? r.reason.message : "unknown"); });
    });

    return NextResponse.json({
      products: prodRes.data ?? [],
      // /tolov havolasi har ochilganda buyurtma yaratadi — to'lovga o'tmaganlari ko'rsatilmaydi.
      orders: (ordRes.data ?? []).filter((o) => !isAbandonedDmOrder(o) && !isAlifSandboxOrder(o)),
      transactions: txRes.data ?? [],
      uzumContracts: ucRes.data ?? [],
      usdRate,
    }, { headers: { "Cache-Control": "no-store" } }); // pul raqamlari hech qayerda keshlanmasin
  } catch (e) {
    console.error("[dashboard/data]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Xatolik" },
      { status: 500 }
    );
  }
}
