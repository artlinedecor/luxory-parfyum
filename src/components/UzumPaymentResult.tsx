"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { readPending, resolvePending } from "@/lib/uzum-pending";

type State = "checking" | "signed" | "not_completed" | "generic" | "error";

/**
 * ⚠️ Uzum mijozni callback'ga HAR DOIM qaytaradi — OTP kiritdimi yoki
 * oynani yopib chiqib ketdimi, farqi yo'q. Shuning uchun bu sahifa
 * shartnoma HAQIQATAN imzolanganini tekshirmasdan "to'lov amalga oshirildi"
 * deb yozmasligi kerak (va Meta'ga soxta Purchase yubormasligi kerak).
 */
export default function UzumPaymentResult() {
  const [state, setState] = useState<State>("checking");
  const { clearCart, items } = useCart();

  useEffect(() => {
    // Uzum oqimi emas (masalan Click to'lovi) — eski xatti-harakat saqlanadi
    if (!readPending()) {
      setState("generic");
      return;
    }
    (async () => {
      // Shartnoma imzolangan bo'lsa — buyurtma AYNAN SHU YERDA bazaga
      // yoziladi va Purchase yuboriladi. Imzolanmagan bo'lsa — hech narsa.
      const res = await resolvePending();
      if (res === "signed") {
        setState("signed");
        if (items.length > 0) clearCart();
      } else if (res === "not_signed") {
        setState("not_completed");
      } else if (res === "none") {
        setState("generic");
      } else {
        setState("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "checking") {
    return (
      <div className="max-w-md mx-auto px-4 text-center space-y-5">
        <span className="inline-block w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Buyurtma holati tekshirilmoqda...</p>
      </div>
    );
  }

  // ❌ Imzolanmagan — mijozni chalg'itmaymiz
  if (state === "not_completed" || state === "error") {
    const isErr = state === "error";
    return (
      <div className="max-w-md mx-auto px-4 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10 text-amber-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
          {isErr ? "Holatni aniqlab bo'lmadi" : "Rasmiylashtirish yakunlanmadi"}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isErr
            ? "Shartnoma holatini tekshirib bo'lmadi. Iltimos, biz bilan bog'laning — buyurtmangizni qo'lda tekshiramiz."
            : "Bo'lib to'lash shartnomasi imzolanmadi (SMS-kod kiritilmagan). Buyurtma rasmiylashtirilmadi va sizdan hech qanday to'lov olinmadi."}
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/cart"
            className="inline-flex items-center justify-center px-6 py-4 rounded-xl bg-gradient-gold text-black font-bold text-sm uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-gold/20"
          >
            Qayta urinib ko&apos;rish
          </Link>
          <a
            href="tel:+998992620101"
            className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-gold/30 text-gold font-semibold text-sm hover:bg-gold/10 transition-all"
          >
            Do&apos;kon bilan bog&apos;lanish
          </a>
        </div>
      </div>
    );
  }

  // ✅ Imzolangan (yoki Click oqimi)
  const signed = state === "signed";
  return (
    <div className="max-w-md mx-auto px-4 text-center space-y-6 animate-fade-in">
      <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto animate-scale-in">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12 text-green-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h2 className="font-heading text-3xl font-bold text-foreground">
        {signed ? "Buyurtma qabul qilindi!" : "To'lov amalga oshirildi!"}
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed">
        {signed
          ? "Bo'lib to'lash shartnomasi imzolandi. Adminlarimiz tovar mavjudligini tasdiqlab, tez orada siz bilan bog'lanadi."
          : "Buyurtmangiz qabul qilindi. Tez orada adminlarimiz siz bilan bog'lanadi va 3 ish kunida yetkazib beriladi."}
      </p>
      <div className="flex flex-col gap-3 pt-6">
        <Link
          href="/catalog"
          className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-gold text-black font-bold text-sm uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-gold/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Katalogga qaytish
        </Link>
      </div>
    </div>
  );
}
