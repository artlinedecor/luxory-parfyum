"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { calculatePremiumPriceUzs, formatUzs } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

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

/** Uzum'ning texnik xatolarini mijozga tushunarli o'zbekchaga o'giradi */
function friendlyError(raw: string): string {
  const t = (raw || "").toLowerCase();
  if (/внешний сервис|не отвеча|попробуйте позже|ulanib bo'lmadi|javob bermadi|timeout/i.test(raw))
    return "Uzum tizimi hozir javob bermayapti. Iltimos, bir necha soniyadan keyin qayta urinib ko'ring.";
  if (/лимит|limit|balance|баланс/i.test(t))
    return "Bo'lib to'lash limitingiz yetarli emas. Boshqa muddatni tanlang yoki Uzum ilovasidan limitni tekshiring.";
  if (/не найден|not found/i.test(t))
    return "Ma'lumot topilmadi. Telefon raqamni tekshirib, qayta urinib ko'ring.";
  if (/авторизац|token/i.test(t))
    return "Ulanishda texnik nosozlik. Iltimos, do'kon bilan bog'laning.";
  return raw || "Xatolik yuz berdi. Qayta urinib ko'ring.";
}

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

export default function UzumCheckout({ initialPhone = "", extOrderId, client, onClose }: UzumCheckoutProps) {
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
    if (!isValidUzPhone(ph)) {
      setError(
        "Telefon raqam noto'g'ri. To'g'ri format: 998 XX XXX XX XX (jami 12 raqam)."
      );
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
      // ⚠️ Uzum 'buyer_id' qaytaradi (user_id emas)
      const uid = Number(j.data?.buyer_id ?? j.data?.user_id ?? j.data?.id);

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
      // Registratsiya kerak — Uzum bergan webview'ga yo'naltiramiz
      if (j.data?.webview) {
        setInfo("Ro'yxatdan o'tish sahifasiga yo'naltirilmoqda...");
        setTimeout(() => { window.location.href = j.data.webview; }, 1200);
        return;
      }
      setInfo("Bo'lib to'lash uchun avval Uzum Nasiya ilovasida ro'yxatdan o'ting va kartangizni qo'shing, so'ng qayta urinib ko'ring.");
    } catch (e) {
      setError(friendlyError(e instanceof Error ? e.message : ""));
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
      setError(friendlyError(e instanceof Error ? e.message : ""));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Buyurtmani Supabase'ga yozadi.
   * Uzum ustunlari (uzum_contract_id...) hali qo'shilmagan bo'lsa —
   * ularsiz qayta urinadi (migratsiya shart emas).
   */
  const saveOrder = async (created: {
    contract_id: number;
    order: number;
    total?: string;
  }) => {
    if (!client) return;
    const supabase = createClient();
    const orderItems = items.map((it) => ({
      product_id: it.product.id,
      title: it.product.title,
      quantity: it.quantity,
      price: priceOf(it.product),
    }));
    const total = Number(created.total) || items.reduce((s, it) => s + priceOf(it.product) * it.quantity, 0);
    const base: Record<string, unknown> = {
      items: orderItems,
      client_name: client.name,
      client_phone: client.phone,
      region: `${client.region} — ${client.address}`,
      status: "pending",
      total_amount: total,
    };

    // 1-urinish: to'liq (migratsiya bajarilgan bo'lsa)
    const full = {
      ...base,
      order_type: "uzum_nasiya",
      uzum_contract_id: created.contract_id,
      uzum_order_id: created.order,
      uzum_period: selected,
    };
    let res = await supabase.from("orders").insert(full).select("id").single();
    if (!res.error) return res.data;

    // 2-urinish: eski sxema (Uzum ustunlarisiz) — shartnoma ma'lumotini
    // BIRINCHI mahsulot ichiga yozamiz (alohida element qilsak dashboard'da
    // soxta "mahsulot" qatori paydo bo'lardi)
    const itemsWithMeta = orderItems.map((it, i) =>
      i === 0
        ? { ...it, _uzum: { contract_id: created.contract_id, order: created.order, period: selected } }
        : it
    );
    res = await supabase
      .from("orders")
      .insert({ ...base, order_type: "full_payment", items: itemsWithMeta })
      .select("id")
      .single();
    if (res.error) throw new Error(res.error.message);
    return res.data;
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

      // Buyurtmani bazaga yozamiz (xato bo'lsa ham rasmiylashtirish to'xtamaydi)
      await saveOrder(j).catch((e) => console.error("Buyurtma saqlanmadi:", e));

      // Qaytib kelganda shartnoma HAQIQATAN imzolanganini tekshirish uchun
      // ma'lumotni saqlab qo'yamiz (Uzum callback'ga bekor qilganda ham qaytaradi)
      try {
        localStorage.setItem(
          "uzum_pending",
          JSON.stringify({
            contract_id: j.contract_id,
            order: j.order,
            total: Number(j.total) || 0,
            ts: Date.now(),
          })
        );
      } catch {}

      setStep("redirect");
      window.location.href = j.webview_path;
    } catch (e) {
      setError(friendlyError(e instanceof Error ? e.message : ""));
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
              className="w-full py-3.5 rounded-xl bg-[#6100FF] text-white font-bold text-sm tracking-wide hover:bg-[#5000E0] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center"
            >
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Davom etish"}
            </button>
          </div>
        )}

        {/* Step: tariffs */}
        {step === "tariffs" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Bo&apos;lib to&apos;lash muddatini tanlang:
            </p>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Raqam:{" "}
              <span className="text-gold font-semibold">
                {prettyPhone(normalizePhone(phone))}
              </span>
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
                      Jami: {formatUzs(Math.round(t.total))} so'm
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gradient-gold">
                      {formatUzs(Math.round(t.month))} so'm
                    </div>
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
