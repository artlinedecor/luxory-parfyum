"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { calculatePremiumPriceUzs, formatUzs } from "@/lib/utils";

interface Tariff {
  tariff: string;
  tariff_name: string;
  period_months: number;
  month: number;
  total: number;
  is_available: boolean;
}

interface UzumCheckoutProps {
  initialPhone?: string;
  extOrderId?: string;
  onClose: () => void;
}

type Step = "phone" | "tariffs" | "redirect";

// 998XXXXXXXXX (12 raqam) ga normalizatsiya
function normalizePhone(v: string): string {
  const d = v.replace(/\D/g, "");
  if (d.startsWith("998")) return d.slice(0, 12);
  if (d.length === 9) return "998" + d;
  return d;
}

export default function UzumCheckout({ initialPhone = "", extOrderId, onClose }: UzumCheckoutProps) {
  const { items } = useCart();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(normalizePhone(initialPhone));
  const [userId, setUserId] = useState<number | null>(null);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const priceOf = (p: { price_usd: number }) => calculatePremiumPriceUzs(p.price_usd);

  // 1) check-status -> agar status=4 bo'lsa 2) calculate
  const handlePhone = async () => {
    const ph = normalizePhone(phone);
    if (ph.length !== 12) {
      setError("Telefon raqamini to'liq kiriting (998 XX XXX XX XX)");
      return;
    }
    setError(""); setInfo(""); setLoading(true);
    try {
      const r = await fetch("/api/uzumnasiya/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: ph }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Xatolik");

      const status = Number(j.data?.status);
      const uid = Number(j.data?.user_id ?? j.data?.id);

      if (status === 4 && uid) {
        setUserId(uid);
        await loadTariffs(uid);
        return;
      }
      // Rad etilgan statuslar
      if ([8, 9, 13, 14, 403].includes(status)) {
        setInfo("Afsuski, bu raqam bo'yicha bo'lib to'lash hozircha mumkin emas. Uzum Nasiya qo'llab-quvvatlash markaziga murojaat qiling.");
        return;
      }
      // Registratsiya kerak
      setInfo("Bo'lib to'lash uchun avval Uzum Nasiya ilovasida ro'yxatdan o'ting va kartangizni qo'shing, so'ng qayta urinib ko'ring.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ulanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // 2) calculate -> tariflar
  const loadTariffs = async (uid: number) => {
    setLoading(true); setError("");
    try {
      const products = items.map((it) => ({
        product_id: it.product.id, // route int ga o'giradi
        price: priceOf(it.product),
        amount: it.quantity,
      }));
      const r = await fetch("/api/uzumnasiya/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid, products }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Tariflar olinmadi");
      const avail = (j.tariffs || []).filter((t: Tariff) => t.is_available);
      if (avail.length === 0) throw new Error("Mavjud tarif topilmadi");
      setTariffs(avail);
      setSelected(avail[0].tariff);
      setStep("tariffs");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  // 3) create-order -> webview_path ga yo'naltirish
  const handleCreate = async () => {
    if (!userId || !selected) return;
    setLoading(true); setError("");
    try {
      const products = items.map((it) => ({
        product_id: it.product.id,
        name: it.product.title,
        price: priceOf(it.product),
        amount: it.quantity,
      }));
      const r = await fetch("/api/uzumnasiya/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, period: selected, products, ext_order_id: extOrderId }),
      });
      const j = await r.json();
      if (!r.ok || !j.webview_path) throw new Error(j.error || "Shartnoma yaratilmadi");
      setStep("redirect");
      window.location.href = j.webview_path;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md glass-card rounded-t-3xl sm:rounded-3xl border border-gold/20 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#6100FF] text-white text-sm font-bold">U</span>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">Uzum Nasiya</h3>
              <p className="text-[11px] text-muted-foreground">Bo'lib to'lash</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary">✕</button>
        </div>

        <div className="gold-hairline" />

        {info && (
          <div className="p-3 rounded-xl bg-gold/10 border border-gold/25 text-xs text-gold-light leading-relaxed">{info}</div>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400 leading-relaxed">{error}</div>
        )}

        {/* Step: phone */}
        {step === "phone" && (
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Uzum Nasiya telefon raqamingiz</label>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="998 90 123 45 67"
              className="w-full px-4 py-3.5 rounded-xl bg-secondary/60 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
            />
            <button
              onClick={handlePhone}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#6100FF] text-white font-bold text-sm tracking-wide hover:bg-[#5000E0] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center"
            >
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Davom etish"}
            </button>
          </div>
        )}

        {/* Step: tariffs */}
        {step === "tariffs" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Bo'lib to'lash muddatini tanlang:</p>
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
                    <div className="text-sm font-bold text-foreground">{t.period_months} oy</div>
                    <div className="text-[11px] text-muted-foreground">{t.tariff_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gradient-gold">{formatUzs(t.month)} so'm</div>
                    <div className="text-[10px] text-muted-foreground">oyiga</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={handleCreate}
              disabled={loading || !selected}
              className="w-full py-3.5 rounded-xl bg-[#6100FF] text-white font-bold text-sm tracking-wide hover:bg-[#5000E0] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center"
            >
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Rasmiylashtirish"}
            </button>
          </div>
        )}

        {step === "redirect" && (
          <div className="py-8 text-center space-y-3">
            <span className="inline-block w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Uzum Nasiya sahifasiga yo'naltirilmoqda...</p>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
          Tasdiqlash SMS-kod (OTP) orqali Uzum Nasiya sahifasida amalga oshiriladi.
        </p>
      </div>
    </div>
  );
}
