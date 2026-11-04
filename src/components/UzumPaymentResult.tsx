"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, Phone } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { readPending, resolvePending } from "@/lib/uzum-pending";

type State = "checking" | "signed" | "pending" | "cancelled" | "generic" | "error";

/**
 * ⚠️ Uzum mijozni callback'ga HAR DOIM qaytaradi — OTP kiritdimi yoki
 * oynani yopib chiqib ketdimi, farqi yo'q. Shuning uchun bu sahifa
 * shartnoma HAQIQATAN imzolanganini tekshirmasdan "to'lov amalga oshirildi"
 * deb yozmasligi kerak (va Meta'ga soxta Purchase yubormasligi kerak).
 */
export default function UzumPaymentResult() {
  const [state, setState] = useState<State>("checking");
  const [attempt, setAttempt] = useState(0);
  const [resumeUrl, setResumeUrl] = useState("");
  const [detail, setDetail] = useState("");
  const { clearCart, items } = useCart();

  useEffect(() => {
    // Uzum oqimi emas (masalan Click to'lovi) — eski xatti-harakat saqlanadi
    const query = new URLSearchParams(window.location.search);
    if (!readPending() && !query.has("uzum_order_id") && !/^\d+$/.test(query.get("order_id") || "")) {
      // localStorage'dagi kutilayotgan buyurtma — tashqi holat,
      // uni faqat brauzerda o'qish mumkin.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("generic");
      return;
    }
    (async () => {
      // Shartnoma imzolangan bo'lsa — buyurtma AYNAN SHU YERDA bazaga
      // yoziladi va Purchase yuboriladi. Imzolanmagan bo'lsa — hech narsa.
      const res = await resolvePending();
      if (res.state === "signed") {
        setState("signed");
        if (items.length > 0) clearCart();
      } else if (res.state === "pending") {
        setState("pending"); setResumeUrl(res.webview_path || "");
        setDetail(res.needs_review
          ? "Uzum javobi hali tasdiqlanmagan. Yangi shartnoma ochmang; buyurtma holatini qayta tekshiring yoki do'kon bilan bog'laning."
          : "Uzum imzolash yakunlanganini hali tasdiqlamadi. Rasmiylashtirishni davom ettiring yoki holatni qayta tekshiring.");
      } else if (res.state === "cancelled") {
        setState("cancelled"); setDetail("Uzum shartnomani bekor qilingan deb qaytardi. Savatga qaytib boshqa to'lov usulini tanlashingiz mumkin.");
      } else {
        setState("error"); setDetail(res.error || "Bu buyurtmani tasdiqlovchi ma'lumot topilmadi. Do'kon bilan bog'laning.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  // Buyurtma haqiqatan qabul qilinganda — juda vazmin tilla salyut.
  // Faqat muvaffaqiyatli holatda va animatsiya so'ralmagan bo'lsa.
  useEffect(() => {
    if (state !== "signed" && state !== "generic") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({
        particleCount: 34,
        spread: 62,
        startVelocity: 28,
        gravity: 0.9,
        ticks: 160,
        scalar: 0.8,
        origin: { y: 0.42 },
        colors: ["#c5a880", "#d4af37", "#ded0b8", "#b39268"],
        disableForReducedMotion: true,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [state]);

  if (state === "checking") {
    return (
      <div className="max-w-md mx-auto px-4 text-center space-y-6">
        <span className="inline-block w-8 h-8 border border-border border-t-gold-dark rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">
          Buyurtma holati tekshirilmoqda...
        </p>
      </div>
    );
  }

  // ❌ Imzolanmagan — mijozni chalg'itmaymiz
  if (state === "pending" || state === "cancelled" || state === "error") {
    const isErr = state === "error";
    return (
      <div className="max-w-md mx-auto px-4 text-center animate-fade-in">
        <span className="inline-flex w-14 h-14 items-center justify-center border border-border">
          <AlertTriangle className="w-6 h-6 text-gold-dark" strokeWidth={1.25} />
        </span>

        <h1 className="font-heading mt-8 text-3xl sm:text-4xl text-foreground">
          {isErr ? "Holatni aniqlab bo'lmadi" : state === "cancelled" ? "Shartnoma bekor qilingan" : "Tasdiqlash kutilmoqda"}
        </h1>

        <div className="gold-hairline w-16 mx-auto mt-6" />

        <p className="mt-6 text-sm text-muted-foreground leading-[1.9]">
          {detail}
        </p>

        <div className="mt-10 flex flex-col gap-2.5">
          {state !== "cancelled" && <button className="btn btn-primary btn-block" onClick={() => { setState("checking"); setAttempt(v => v + 1); }}>Holatni qayta tekshirish</button>}
          {resumeUrl && state === "pending" && <a href={resumeUrl} className="btn btn-primary btn-block">Uzumda davom etish</a>}
          <Link
            href="/cart"
            className="btn btn-primary btn-block"
          >
            Savatga qaytish
          </Link>
          <a
            href="tel:+998992620101"
            className="btn btn-outline btn-block btn-sm"
          >
            <Phone className="w-3.5 h-3.5" strokeWidth={1.5} />
            Do&apos;kon bilan bog&apos;lanish
          </a>
        </div>
      </div>
    );
  }

  // ✅ Imzolangan (yoki Click oqimi)
  const signed = state === "signed";
  return (
    <div className="max-w-md mx-auto px-4 text-center animate-fade-in">
      <span className="inline-flex w-14 h-14 items-center justify-center border border-gold animate-scale-in">
        <Check className="w-6 h-6 text-gold-dark" strokeWidth={1.25} />
      </span>

      <h1 className="font-heading mt-8 text-3xl sm:text-4xl text-foreground">
        {signed ? "Buyurtma qabul qilindi" : "To'lov amalga oshirildi"}
      </h1>

      <div className="gold-hairline w-16 mx-auto mt-6" />

      <p className="mt-6 text-sm text-muted-foreground leading-[1.9]">
        {signed
          ? "Bo'lib to'lash shartnomasi imzolandi. Adminlarimiz tovar mavjudligini tasdiqlab, tez orada siz bilan bog'lanadi."
          : "Buyurtmangiz qabul qilindi. Tez orada adminlarimiz siz bilan bog'lanadi va 3 ish kunida yetkazib beriladi."}
      </p>

      <Link
        href="/catalog"
        className="btn btn-outline btn-block mt-10"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
        Katalogga qaytish
      </Link>
    </div>
  );
}
