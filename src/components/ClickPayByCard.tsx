"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "Har qanday karta bilan to'lash" — Click Pay by Card.
 * Manba: https://docs.click.uz/en/click-pay-by-card/
 *
 * Mijoz saytdan chiqmaydi: karta raqami va amal muddatini o'zi kiritadi,
 * qaysi bankniki bo'lishidan qat'i nazar. Click'ga ulanish shart emas.
 *
 * ⚠️ Bu eski `card_type=uzcard` havolasidan FARQ qiladi — u faqat UZCARD
 * kartalarini qabul qilardi.
 *
 * checkout.js `createPaymentRequest(params, callback)` funksiyasini global
 * ko'rinishda qo'shadi. callback `{ status }` qaytaradi:
 *    < 0  xato
 *      0  to'lov yaratildi
 *      1  ishlanmoqda
 *      2  muvaffaqiyatli
 */

declare global {
  interface Window {
    createPaymentRequest?: (
      params: {
        service_id: number;
        merchant_id: number;
        amount: number;
        transaction_param: string;
        merchant_user_id?: string;
        card_type?: string;
      },
      callback: (data: { status: number }) => void
    ) => void;
  }
}

const SCRIPT_SRC = "https://my.click.uz/pay/checkout.js";

export default function ClickPayByCard({
  amountUzs,
  orderId,
  onPaid,
}: {
  amountUzs: number;
  orderId: string;
  onPaid?: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    if (typeof window.createPaymentRequest === "function") {
      setReady(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => setReady(true));
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => setReady(true);
    s.onerror = () => setMsg("Click to'lov oynasini yuklab bo'lmadi. Internetni tekshiring.");
    document.body.appendChild(s);
  }, []);

  const serviceId = Number(process.env.NEXT_PUBLIC_CLICK_SERVICE_ID);
  const merchantId = Number(process.env.NEXT_PUBLIC_CLICK_MERCHANT_ID);

  const pay = () => {
    if (!window.createPaymentRequest) {
      setMsg("To'lov oynasi hali tayyor emas. Bir lahza kuting.");
      return;
    }
    setMsg("");
    setBusy(true);
    window.createPaymentRequest(
      {
        service_id: serviceId,
        merchant_id: merchantId,
        amount: Number(amountUzs),
        transaction_param: orderId,
        // card_type berilmaydi => HAR QANDAY karta qabul qilinadi
      },
      (data) => {
        setBusy(false);
        const st = Number(data?.status);
        if (st === 2) {
          setMsg("");
          onPaid?.();
        } else if (st === 1 || st === 0) {
          setMsg("To'lov qabul qilindi, tasdiqlanmoqda. Buyurtmangiz tez orada rasmiylashtiriladi.");
        } else {
          // ⚠️ Bosh berk ko'cha bo'lmasin — pastda muqobil tugmalar turadi.
          setMsg("To'lov amalga oshmadi. Quyidagi boshqa usullardan birini tanlang.");
        }
      }
    );
  };

  if (!serviceId || !merchantId) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={pay}
        disabled={!ready || busy}
        className="btn btn-primary btn-block btn-sm disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
        {busy ? "To'lov oynasi ochilmoqda..." : !ready ? "Yuklanmoqda..." : "Karta raqami bilan to'lash"}
      </button>
      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        Uzcard, Humo va boshqa bank kartalari. Click&apos;ga ulanish shart emas.
      </p>
      {msg && (
        <div className="p-2.5 bg-destructive/8 border border-destructive/25 text-[11px] text-destructive leading-relaxed">
          {msg}
        </div>
      )}
    </div>
  );
}
