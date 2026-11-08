"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";
import { ALIF_SESSION, readAlifSession, matchesAlifCart, type AlifResult } from "@/lib/alif-client";

export default function AlifPaymentPage() {
  const { lang } = useI18n(), ru = lang === "ru";
  const { clearCart, items } = useCart();
  const cart = useRef(items);
  useEffect(() => { cart.current = items; }, [items]);
  const [result, setResult] = useState<AlifResult | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const running = useRef(false), cleared = useRef(false);
  const check = useCallback(async () => {
    if (running.current) return;
    running.current = true; setBusy(true); setError("");
    try {
      const id = new URLSearchParams(window.location.search).get("order_id");
      const saved = readAlifSession();
      const response = await fetch("/api/alifpay/status", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ order_id: id, recovery_token: saved?.request_id === id ? saved.recovery_token : undefined,
          recovery_receipt: saved?.request_id === id ? saved.recovery_receipt : undefined }) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || "Alif");
      setResult(value);
      if (value.state === "paid" && !value.sandbox && !cleared.current && saved?.request_id === id &&
          matchesAlifCart(saved, cart.current.map(it => ({ product_id: it.product.id, quantity: it.quantity })))) { cleared.current = true; clearCart(); }
    } catch (e) { setError(e instanceof Error ? e.message : "Alif bilan aloqa uzildi"); }
    finally { setBusy(false); running.current = false; }
  }, [clearCart]);
  useEffect(() => { const timer = window.setTimeout(() => { void check(); }, 0); return () => window.clearTimeout(timer); }, [check]);
  const title = result?.state === "paid" ? (ru ? "Оплата подтверждена" : "To'lov tasdiqlandi")
    : result?.state === "refunded" ? (ru ? "Оплата возвращена" : "To'lov qaytarilgan")
    : (ru ? "Проверка оплаты Alif" : "Alif to'lovini tekshirish");
  return <><Header /><main className="min-h-[70vh] pt-28 pb-24 px-4 flex items-center justify-center">
    <div className="glass-card p-6 w-full max-w-md text-center space-y-5">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {result?.sandbox && <p className="text-sm text-muted-foreground">{ru ? "Тест Alif. Это не настоящий заказ: деньги не списаны, доставка не оформлена." : "Alif testi. Haqiqiy pul yechilmagan, yetkazib berish rasmiylashtirilmagan."}</p>}
      {result?.state === "paid" && !result.sandbox && <p>{result.order_status === "cancelled"
        ? (ru ? "Заказ отменён. Свяжитесь с магазином для проверки оплаты." : "Buyurtma bekor qilingan. To'lov bo'yicha do'kon bilan bog'laning.")
        : (ru ? "Оплата заказа записана." : "Buyurtma to'lovi qayd etildi.")}</p>}
      {result?.state === "pending" && <p className="text-sm text-muted-foreground">{result.expired
        ? (ru ? "Срок счёта истёк. Для нового счёта свяжитесь с магазином." : "Hisob muddati tugagan. Yangi hisob uchun do'kon bilan bog'laning.")
        : (ru ? "Оплата ещё не подтверждена. Проверьте статус после завершения оплаты." : "To'lov hali tasdiqlanmagan. To'lovdan so'ng holatni qayta tekshiring.")}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {result?.receipt_urls?.map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-block">{ru ? "Фискальный чек" : "Fiskal chek"}{result.receipt_urls!.length > 1 ? ` ${index + 1}` : ""}</a>)}
      <button onClick={check} disabled={busy} className="btn btn-primary btn-block">{busy ? (ru ? "Проверяем…" : "Tekshirilmoqda…") : (ru ? "Проверить статус" : "Holatni tekshirish")}</button>
      {result?.checkout_url && <a className="btn btn-outline btn-block" href={result.checkout_url}>{ru ? "Продолжить в Alif" : "Alif'da davom etish"}</a>}
      {result && (result.state !== "pending" || result.expired) && <button className="btn btn-ghost btn-block" onClick={() => { sessionStorage.removeItem(ALIF_SESSION); window.location.assign("/cart"); }}>{ru ? "Вернуться в корзину" : "Savatga qaytish"}</button>}
      <Link className="block text-sm underline" href="/cart">{ru ? "Корзина" : "Savatcha"}</Link>
    </div>
  </main><BottomNav /></>;
}
