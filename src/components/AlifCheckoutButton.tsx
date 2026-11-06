"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { ALIF_SESSION, readAlifSession, writeAlifSession } from "@/lib/alif-client";

interface Props {
  disabled: boolean; expectedTotal: number; items: { product_id: string; quantity: number }[];
  client: { name: string; phone: string; region: string; address: string };
}
export default function AlifCheckoutButton({ disabled, expectedTotal, items, client }: Props) {
  const { lang } = useI18n(); const ru = lang === "ru";
  const [config, setConfig] = useState<{ enabled: boolean; sandbox?: boolean }>({ enabled: false });
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [recoveryId, setRecoveryId] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/alifpay/config", { cache: "no-store", signal: controller.signal }).then(r => r.json()).then(setConfig).catch(() => {});
    return () => controller.abort();
  }, []);
  if (!config.enabled) return null;
  async function start() {
    if (lock.current || disabled) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const normalized = { ...client, phone: client.phone.replace(/\D/g, "") };
      const fingerprint = JSON.stringify({ items, client: normalized, expectedTotal, sandbox: config.sandbox });
      const saved = readAlifSession();
      if (saved && saved.fingerprint !== fingerprint) {
        setRecoveryId(saved.request_id);
        throw new Error(ru ? "Сначала проверьте предыдущий счёт." : "Avval oldingi hisob holatini tekshiring.");
      }
      const session = saved || { request_id: crypto.randomUUID(), recovery_token: crypto.randomUUID(), fingerprint, sandbox: config.sandbox };
      writeAlifSession(session); // Must survive a lost response before any provider request.
      setRecoveryId(session.request_id);
      const response = await fetch("/api/alifpay/create", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...session, client: normalized, items, expected_total: expectedTotal }) });
      const value = await response.json();
      if (value.recovery_receipt) writeAlifSession({ ...session, recovery_receipt: value.recovery_receipt });
      if (!response.ok) {
        if (value.attempt_not_created === true) { sessionStorage.removeItem(ALIF_SESSION); setRecoveryId(""); }
        throw new Error(value.error || "Alif");
      }
      if (value.checkout_url) {
        const url = new URL(value.checkout_url);
        if (url.origin !== (config.sandbox ? "https://checkout-dev.alifpay.uz" : "https://checkout.alifpay.uz")) throw new Error("Invalid checkout URL");
        window.location.assign(url.toString());
      } else window.location.assign(`/alif-payment?order_id=${session.request_id}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Alif bilan aloqa uzildi"); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="space-y-2">
    <button id="alif-checkout-btn" type="button" onClick={start} disabled={disabled || busy}
      className="btn btn-outline btn-block disabled:opacity-40 disabled:cursor-not-allowed">
      {busy ? (ru ? "Подождите…" : "Kuting…") : `${ru ? "Оплатить через Alif" : "Alif orqali to'lash"}${config.sandbox ? " · TEST" : ""}`}
    </button>
    <p className="text-xs text-muted-foreground text-center">{config.sandbox
      ? (ru ? "Тестовый режим. Настоящие деньги не списываются." : "Test rejimi. Haqiqiy pul yechilmaydi.")
      : (ru ? "Доступные способы и условия — на странице Alif." : "Mavjud usullar va shartlar Alif sahifasida ko'rsatiladi.")}</p>
    {error && <div role="alert" className="text-sm text-destructive space-y-2"><p>{error}</p>
      {recoveryId && <Link className="underline" href={`/alif-payment?order_id=${recoveryId}`}>{ru ? "Проверить счёт" : "Hisobni tekshirish"}</Link>}
    </div>}
  </div>;
}
