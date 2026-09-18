import { serverSupabase } from "@/lib/supabase-server";

/**
 * Admin (dashboard yoki Telegram bot orqali) Uzum shartnomasini
 * tasdiqlagan/bekor qilgandan keyin, bog'liq buyurtma qatorini ham shu
 * holatga moslaydi.
 *
 * ⚠️ Buni qo'shmasdan oldin: `confirmContract()` / `cancelContract()`
 * faqat UZUM tomonidagi shartnomani o'zgartirardi — bizning `orders`
 * jadvalimizga hech qanday ta'sir qilmasdi. Natijada admin "Tasdiqlash"
 * tugmasini bossa ham, buyurtma ro'yxatida hamon "Kutilmoqda" (pending)
 * bo'lib qolardi — xuddi oddiy, hali hech narsa qilinmagan buyurtma
 * bilan bir xil ko'rinardi. Endi tasdiqlangan buyurtma "processing"
 * (Tasdiqlangan — jo'natish kerak) holatiga o'tadi va ro'yxatda darhol
 * ajralib turadi.
 *
 * Ikkala chaqiruvchi ham (dashboard'dagi /api/uzumnasiya/contracts va
 * Telegram bot webhook'i) shu funksiyani ishlatadi — mantiq bitta
 * joyda, ikkalasida bir xil ishlaydi.
 */
export async function syncOrderAfterContractAction(
  ids: { contractId?: number; orderNo?: number },
  action: "confirm" | "cancel"
): Promise<void> {
  const supabase = serverSupabase();

  let query = supabase.from("uzum_contracts").select("contract_id, order_row_id");
  if (ids.contractId) query = query.eq("contract_id", ids.contractId);
  else if (ids.orderNo) query = query.eq("uzum_order_id", ids.orderNo);
  else return;

  const { data: contract, error } = await query.maybeSingle();
  if (error) {
    console.error("[uzum-order-sync] uzum_contracts o'qilmadi", error);
    return;
  }
  if (!contract?.order_row_id) {
    // Eski (2026-08 dan oldingi) shartnomalarda order_row_id yo'q
    // bo'lishi mumkin — jimgina o'tkazib yuboramiz.
    return;
  }

  const orderPatch =
    action === "confirm"
      ? { status: "processing", payment_status: "paid" }
      : { status: "cancelled", payment_status: "cancelled" };

  const { error: oErr } = await supabase
    .from("orders")
    .update(orderPatch)
    .eq("id", contract.order_row_id);
  if (oErr) console.error("[uzum-order-sync] orders yangilanmadi", oErr);

  const { error: cErr } = await supabase
    .from("uzum_contracts")
    .update({
      status: action === "confirm" ? "confirmed" : "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("contract_id", contract.contract_id);
  if (cErr) console.error("[uzum-order-sync] uzum_contracts yangilanmadi", cErr);
}
