"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { calculateOriginalPriceUzs, calculatePremiumPriceUzs, formatUzs } from "@/lib/utils";
import { savePending } from "@/lib/uzum-pending";
import { buyerNextStep } from "@/lib/uzum-flow";
import { checkoutRequest, clearCheckoutRequest, readCheckoutContact, saveCheckoutContact, saveCheckoutReceipt, readCheckoutRequest } from "@/lib/uzum-checkout-session";
import { siteConfig } from "@/config/site";
import UzumSupport from "@/components/UzumSupport";
import UzPhoneInput from "@/components/UzPhoneInput";
import { fetchUzumRead, friendlyUzumError as friendlyError } from "@/lib/uzum-checkout-client";
import type { BuyerStatusData } from "@/lib/uzumnasiya";
import { parseUzumQuote } from "@/lib/uzum-quote";

interface Tariff {
  tariff: string;
  tariff_name: string;
  title_uz?: string;
  title_ru?: string;
  period_months: number;
  month: number;
  total: number;
  origin?: number;
  is_available: boolean;
  deposit?: number;
  first_payment_date?: string;
  /** Uzum tarif mavjud bo'lmasa SABABINI shu yerda qaytaradi */
  error_message?: string;
}

interface UzumCheckoutProps {
  initialPhone?: string;
  extOrderId?: string;
  /** Buyurtmani bazaga yozish uchun mijoz ma'lumotlari */
  client?: {
    name: string;
    phone: string;
    address: string;
    region: string;
  };
  onClose: () => void;
}

type Step = "phone" | "tariffs" | "redirect";

/**
 * 998XXXXXXXXX (12 raqam) ga keltiradi.
 * ⚠️ HECH QACHON kesmaydi — avval `.slice(0,12)` qilardi va noto'g'ri
 * kiritilgan 13 raqamli son BOSHQA ODAMNING raqamiga aylanib, SMS
 * o'shanga ketardi. Endi noto'g'ri uzunlik "yaroqsiz" deb belgilanadi.
 */
function normalizePhone(v: string): string {
  let d = (v || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9) d = "998" + d; // 90 123 45 67 ko'rinishida kiritilgan
  return d;
}

/** Faqat 998 + 9 raqam qabul qilinadi */
function isValidUzPhone(d: string): boolean {
  return /^998\d{9}$/.test(d);
}

/** +998 99 102 02 00 ko'rinishida chiroyli ko'rsatish */
function prettyPhone(d: string): string {
  if (!isValidUzPhone(d)) return d;
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
}

export default function UzumCheckout({ initialPhone = "", client, onClose }: UzumCheckoutProps) {
  const { items } = useCart();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(normalizePhone(initialPhone));
  const [userId, setUserId] = useState<number | null>(null);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  // Uzum check-status javobida bergan verifikatsiya / limit olish WebView linki
  const [webviewUrl, setWebviewUrl] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [recoveryPath, setRecoveryPath] = useState("");
  const creating = useRef(false);
  const phoneAttempt = useRef(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  // ⚠️ Original atirlar narxi BOSHQACHA hisoblanadi. Oldin bu yerda hammaga
  // calculatePremiumPriceUzs (qat'iy 800 000) qo'llanardi va original mahsulot
  // savatda 2 mln ko'rinib, Uzumga 800 000 uzatilardi — ya'ni zarar.
  // Manba: cart-context.tsx dagi totalPrice bilan bir xil bo'lishi SHART.
  const priceOf = (p: { price_usd: number; product_type?: "lux_copy" | "original" }) =>
    p.product_type === "original"
      ? calculateOriginalPriceUzs(p.price_usd)
      : calculatePremiumPriceUzs(p.price_usd);

  // 1) check-status -> agar status=4 bo'lsa 2) calculate
  const handlePhone = async () => {
    const attempt = ++phoneAttempt.current;
    const ph = normalizePhone(phone);
    if (!isValidUzPhone(ph)) {
      setError(
        "Telefon raqam noto'g'ri. To'g'ri format: 998 XX XXX XX XX (jami 12 raqam)."
      );
      return;
    }
    setError(""); setInfo(""); setWebviewUrl(""); setNeedsVerification(false);
    setUserId(null); setTariffs([]); setSelected(""); setStep("phone"); setLoading(true);
    try {
      const { ok, data: j } = await fetchUzumRead<{ error?: string; data?: BuyerStatusData }>("/api/uzumnasiya/check-status", { phone: ph });
      if (attempt !== phoneAttempt.current || !mounted.current) return;
      if (!ok) throw new Error(j.error || "Xatolik");

      const next = buyerNextStep(j.data || {});
      if (next.step === "calculate" && next.userId) {
        setUserId(next.userId);
        await loadTariffs(next.userId, attempt);
        return;
      }
      if (next.step === "verify") {
        setNeedsVerification(true);
        setWebviewUrl(next.webview || "");
      }
      if (next.step === "error") setError(next.message || "Uzum javobini tekshirib bo'lmadi.");
      else setInfo(next.message || "Uzum ilovasida holatingizni tekshiring.");
    } catch (e) {
      if (attempt !== phoneAttempt.current || !mounted.current) return;
      setError(friendlyError(e instanceof Error ? e.message : ""));
    } finally {
      if (attempt === phoneAttempt.current && mounted.current) setLoading(false);
    }
  };

  // Savatda kiritilgan raqam to'g'ri bo'lsa, "Davom etish"ni qayta bostirmaymiz —
  // tekshiruv darhol boshlanadi. Raqamni tariflar bosqichida o'zgartirsa bo'ladi.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStarted.current || !isValidUzPhone(normalizePhone(initialPhone))) return;
    autoStarted.current = true;
    void handlePhone();
    // faqat birinchi ochilishda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changePhone = () => {
    phoneAttempt.current++; setLoading(false);
    setStep("phone"); setTariffs([]); setSelected(""); setUserId(null);
    setError(""); setInfo("");
    setWebviewUrl(""); setNeedsVerification(false);
  };

  // 2) calculate -> tariflar
  async function loadTariffs(uid: number, attempt = phoneAttempt.current) {
    setLoading(true); setError(""); setInfo("");
    try {
      const products = items.map((it) => ({
        product_id: it.product.id, // route int ga o'giradi
        price: priceOf(it.product),
        amount: it.quantity,
      }));
      const { ok, data: j } = await fetchUzumRead<{ error?: string; tariffs?: Tariff[] }>("/api/uzumnasiya/calculate", { user_id: uid, products });
      if (attempt !== phoneAttempt.current || !mounted.current) return;
      if (!ok) throw new Error(j.error || "Tariflar olinmadi");
      if (!Array.isArray(j.tariffs)) throw new Error("Uzum tariflar javobini to'liq qaytarmadi. Qayta tekshiring.");
      const all: Tariff[] = j.tariffs;
      const eligible = all.filter(t => t?.is_available === true);
      const avail = eligible.filter(t => parseUzumQuote(t) !== null);
      if (eligible.length && !avail.length) throw new Error("Uzum to'lov shartlari yoki birinchi to'lov sanasini to'liq qaytarmadi. Qayta tekshiring yoki Telegram orqali yordam so'rang.");
      if (avail.length === 0) {
        // Uzum HAR BIR tarif uchun `error_message` da sababni qaytaradi
        // (limit yetmadi / summa tarif chegarasidan tashqarida va h.k.).
        // Avval bu tashlab yuborilardi - na mijoz, na biz sababni korardik.
        console.warn("[uzum] calculate: mavjud tarif yoq", j);
        const reason = all.map((t) => t?.error_message).find((m) => m && m.trim());
        throw new Error(
          reason ||
            (all.length === 0
              ? "Uzum bu savat uchun hech qanday tarif qaytarmadi. Summa yoki raqamni tekshiring."
              : "Bu summa uchun mavjud tarif yoq: limitingiz yetarli emas yoki summa tarif chegarasidan tashqarida.")
        );
      }
      setTariffs(avail);
      setSelected(avail[0].tariff);
      setStep("tariffs");
    } catch (e) {
      if (attempt !== phoneAttempt.current || !mounted.current) return;
      setError(friendlyError(e instanceof Error ? e.message : ""));
    } finally {
      if (attempt === phoneAttempt.current && mounted.current) setLoading(false);
    }
  }

  // 3) create-order -> webview_path ga yo'naltirish
  const handleCreate = async () => {
    if (!userId || !selected || creating.current) return;
    creating.current = true;
    setLoading(true); setError("");
    try {
      const products = items.map((it) => ({
        product_id: it.product.id,
        name: it.product.title,
        price: priceOf(it.product),
        amount: it.quantity,
      }));
      const selectedTariff = tariffs.find(t => t.tariff === selected);
      if (!selectedTariff) throw new Error("Tarifni qayta tanlang.");
      const expected_quote = parseUzumQuote(selectedTariff);
      if (!expected_quote) throw new Error("Uzum to'lov shartlarini to'liq qaytarmadi. Tariflarni qayta hisoblang.");
      const request = checkoutRequest(JSON.stringify({ userId, selected, products, client, expected_quote }));
      const r = await fetch("/api/uzumnasiya/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, period: selected, products, client: { ...client, phone: normalizePhone(phone) },
          expected_total: selectedTariff.total, expected_quote, ...request }),
      });
      const j = await r.json();
      if (j.recovery_receipt) saveCheckoutReceipt(request.request_id, j.recovery_receipt);
      if (!mounted.current) return;
      if (j.recovery_path && (!r.ok || !j.webview_path)) {
        window.location.href = j.recovery_path;
        return;
      }
      if (!r.ok || !j.webview_path) {
        if (r.status === 400 || r.status === 409) clearCheckoutRequest();
        throw new Error(j.error || "Shartnoma yaratilmadi");
      }

      // Server already persisted the pending order. This is an optional recovery cache.
      savePending({
        order_row_id: j.order_row_id,
        recovery_token: request.recovery_token,
        contract_id: j.contract_id,
        order: j.order,
        period: selected,
        total: Number(j.total) || items.reduce((s, it) => s + priceOf(it.product) * it.quantity, 0),
        client: client ?? { name: "", phone: normalizePhone(phone), address: "", region: "" },
        items: items.map((it) => ({
          product_id: it.product.id,
          title: it.product.title,
          quantity: it.quantity,
          price: priceOf(it.product),
        })),
        ts: Date.now(),
      });

      setStep("redirect");
      window.location.href = j.webview_path;
    } catch (e) {
      if (!mounted.current) return;
      setError(friendlyError(e instanceof Error ? e.message : ""));
      const request = readCheckoutRequest();
      setRecoveryPath(request ? `/payment-success?uzum_order_id=${request.request_id}` : "");
      setLoading(false);
    } finally {
      creating.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-[#1a1a1a]/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full sm:max-w-md glass-card rounded-t-3xl sm:rounded-3xl border border-gold/20 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#6100FF] text-white text-sm font-semibold">U</span>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">Uzum Nasiya</h3>
              <p className="text-[11px] text-muted-foreground">Bo&apos;lib to&apos;lash</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary">✕</button>
        </div>

        <div className="gold-hairline" />

        {info && (
          <div className="p-3.5 rounded-xl bg-gold-muted border border-gold/30 text-xs text-gold-deep leading-relaxed">{info}</div>
        )}
        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/8 border border-destructive/25 text-xs text-destructive leading-relaxed">{error}</div>
        )}
        {error && step === "tariffs" && userId && !recoveryPath && <button type="button" disabled={loading}
          onClick={() => loadTariffs(userId)} className="btn btn-outline btn-block btn-sm">Tariflarni qayta hisoblash</button>}
        {error && recoveryPath && <a href={recoveryPath} className="btn btn-outline btn-block btn-sm">Oldingi rasmiylashtirish holatini tekshirish</a>}
        {(error || (info && !needsVerification) || (needsVerification && !webviewUrl)) && <UzumSupport />}
        {!error && ((needsVerification && webviewUrl) || loading || step === "redirect") && <UzumSupport collapsible />}

        {/* Limit yo'q / tarif yo'q holatida mijozni boshi berk ko'chada qoldirmaymiz */}
        {needsVerification && webviewUrl && step === "phone" && (
          <a
            href={webviewUrl}
            className="btn btn-uzum btn-block no-underline"
            rel="noopener noreferrer"
            onClick={() => {
              if (client) saveCheckoutContact({ ...client, phone: normalizePhone(phone), region: readCheckoutContact()?.region || client.region });
              try { sessionStorage.setItem("uzum_resume", "1"); } catch { /* form may need to be re-entered */ }
            }}
          >
            {"Uzum Nasiyada verifikatsiyadan o'tish"}
          </a>
        )}

        {/* Step: phone */}
        {step === "phone" && (
          <div className="space-y-4">
            <label htmlFor="uzum-phone" className="block text-sm font-semibold text-foreground">Uzum Nasiyadagi telefon raqamingiz</label>
            <UzPhoneInput id="uzum-phone" value={phone} onChange={value => { phoneAttempt.current++; setLoading(false); setPhone(value); setWebviewUrl(""); setNeedsVerification(false); setInfo(""); setError(""); }} />
            {/* Mijoz xato raqamni oldindan ko'rsin — SMS aynan shu raqamga ketadi */}
            {isValidUzPhone(normalizePhone(phone)) ? (
              <p className="text-[11px] text-muted-foreground">
                SMS-kod shu raqamga yuboriladi:{" "}
                <span className="text-gold font-semibold">
                  {prettyPhone(normalizePhone(phone))}
                </span>
              </p>
            ) : (
              normalizePhone(phone).length > 3 && (
                <p className="text-[11px] text-amber-400">
                  Raqam to&apos;liq emas yoki ortiqcha raqam bor (998 + 9 ta raqam bo&apos;lishi kerak)
                </p>
              )
            )}
            <button
              onClick={handlePhone}
              disabled={loading}
              className="btn btn-uzum btn-block"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Limit tekshirilmoqda…
                </>
              ) : info || error ? "Qayta tekshirish" : "Davom etish"}
            </button>
          </div>
        )}

        {/* Step: tariffs */}
        {step === "tariffs" && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Muddatni tanlang</p>
            <p className="text-xs text-muted-foreground -mt-1">
              Raqam:{" "}
              <span className="text-gold font-semibold">
                {prettyPhone(normalizePhone(phone))}
              </span>{" "}
              <button type="button" onClick={changePhone} className="underline underline-offset-2 hover:text-foreground">
                o&apos;zgartirish
              </button>
            </p>
            <div className="space-y-2">
              {tariffs.map((t) => (
                <button
                  key={t.tariff}
                  onClick={() => setSelected(t.tariff)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    selected === t.tariff
                      ? "border-gold bg-gold/10 shadow-md shadow-gold/10"
                      : "border-border hover:border-foreground/30"
                  }`}
                >
                  <div className="text-left">
                    <div className="text-sm font-bold text-foreground">
                      {t.title_uz || `${t.period_months} oy`}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Jami: {formatUzs(Math.round(t.total))} so&apos;m
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Boshlang&apos;ich to&apos;lov: {formatUzs(Number(t.deposit) || 0)} so&apos;m
                    </div>
                    {t.first_payment_date && <div className="text-[11px] text-muted-foreground">
                      Birinchi to&apos;lov: {t.first_payment_date.slice(0, 10).split("-").reverse().join(".")}
                    </div>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">
                      {formatUzs(Math.round(t.month))} so&apos;m
                    </div>
                    <div className="text-[10px] text-muted-foreground">oyiga</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={handleCreate}
              disabled={loading || !selected}
              className="btn btn-uzum btn-block"
            >
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Rasmiylashtirish — SMS-kodga o'tish"}
            </button>
          </div>
        )}

        {step === "redirect" && (
          <div className="py-8 text-center space-y-3">
            <span className="inline-block w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Uzum Nasiya sahifasiga yo&apos;naltirilmoqda...</p>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
          Tasdiqlash SMS-kod (OTP) orqali Uzum Nasiya sahifasida amalga oshiriladi.
        </p>
        {(error || info) && <a className="btn btn-outline btn-block btn-sm" href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>Do&apos;kon bilan bog&apos;lanish</a>}
      </div>
    </div>
  );
}
