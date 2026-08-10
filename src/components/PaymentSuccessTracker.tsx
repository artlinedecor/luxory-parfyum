"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/meta-tracker";
import { useCart } from "@/lib/cart-context";

/**
 * To'lov/shartnoma muvaffaqiyatli tugagach Meta Purchase eventini yuboradi.
 * Bir xil buyurtma uchun ikki marta yubormaslik uchun localStorage bilan himoyalangan.
 */
export default function PaymentSuccessTracker() {
  const { totalPrice, items, clearCart } = useCart();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id") || params.get("transaction_param") || "unknown";

    const key = `purchase_sent_${orderId}`;
    if (localStorage.getItem(key)) return; // dublikatni oldini olish

    // Savat bo'sh bo'lsa (boshqa qurilma/qaytish) — saqlangan summani ishlatamiz
    const stored = Number(localStorage.getItem("last_order_total") || 0);
    const value = totalPrice > 0 ? totalPrice : stored;

    const eid = `pur_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    trackMetaEvent("Purchase", eid, {}, {
      value,
      currency: "UZS",
      content_ids: items.map((i) => i.product.id),
      content_type: "product",
      order_id: orderId,
    });

    localStorage.setItem(key, "1");
    localStorage.removeItem("last_order_total");
    if (items.length > 0) clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
