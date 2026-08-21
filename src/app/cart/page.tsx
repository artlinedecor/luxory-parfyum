"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { siteConfig } from "@/config/site";
import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { trackMetaEvent } from "@/lib/meta-tracker";
import { calculateOriginalPriceUzs, calculatePremiumPriceUzs, formatUzs } from "@/lib/utils";
import UzumCheckout from "@/components/UzumCheckout";

const REGIONS = [
  "region_tashkent_city",
  "region_tashkent",
  "region_andijan",
  "region_bukhara",
  "region_jizzakh",
  "region_kashkadarya",
  "region_navoi",
  "region_namangan",
  "region_samarkand",
  "region_surkhandarya",
  "region_syrdarya",
  "region_fergana",
  "region_khorezm",
  "region_karakalpakstan",
];

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const { t } = useI18n();
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientRegion, setClientRegion] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  // ⚠️ Audit U1: alert() o'rniga — mijozga keyingi qadam tugmalari kerak
  const [checkoutError, setCheckoutError] = useState("");
  const [loading, setLoading] = useState(false);

  const [dynPaymentCard, setDynPaymentCard] = useState<string>(siteConfig.paymentCard);
  const [dynPaymentCardHolder, setDynPaymentCardHolder] = useState<string>(siteConfig.paymentCardHolder);
  const [dynTelegramAdminUsername, setDynTelegramAdminUsername] = useState<string>(siteConfig.telegramAdminUsername);

  useEffect(() => {
    const s = localStorage.getItem("shop_settings");
    if (s) {
      try {
        const parsed = JSON.parse(s);
        if (parsed.paymentCard) setDynPaymentCard(parsed.paymentCard);
        if (parsed.paymentCardHolder) setDynPaymentCardHolder(parsed.paymentCardHolder);
        if (parsed.telegramAdminUsername) setDynTelegramAdminUsername(parsed.telegramAdminUsername);
      } catch { /* ignore */ }
    }
  }, []);

  // InitiateCheckout — savatcha sahifasi ochilganda (agar mahsulotlar bo'lsa)
  useEffect(() => {
    if (items.length > 0) {
      const eid = `ic_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      trackMetaEvent("InitiateCheckout", eid, {}, {
        value: totalPrice,
        currency: "UZS",
        num_items: items.reduce((s, i) => s + i.quantity, 0),
        content_ids: items.map(i => i.product.id),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasOriginal = items.some(
    (item) => item.product.product_type === "original"
  );

  const paymentAmount = totalPrice;

  const [showUzum, setShowUzum] = useState(false);

  const handleUzumCheckout = () => {
    if (!clientName.trim() || !clientPhone.trim() || !clientAddress.trim() || !clientRegion) return;
    // InitiateCheckout (Uzum) event
    const eid = `ic_uzum_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    trackMetaEvent("InitiateCheckout", eid, {}, {
      value: totalPrice,
      currency: "UZS",
      num_items: items.reduce((s, i) => s + i.quantity, 0),
      content_ids: items.map((i) => i.product.id),
    });
    setShowUzum(true);
  };

  const handleCheckout = async () => {
    if (!clientName.trim() || !clientPhone.trim() || !clientAddress.trim() || !clientRegion) return;

    setCheckoutError("");
    setLoading(true);

    try {
      // ⚠️ Audit P1: buyurtma endi SERVER tomonda yaratiladi.
      // Oldin savat anon kalit bilan to'g'ridan-to'g'ri Supabase'ga
      // yozardi va total_amount ni O'ZI hisoblardi — DevTools'dan
      // 1000 so'm yozib, istalgan atirni arzonga olish mumkin edi.
      //
      // Serverga FAQAT product_id va miqdor yuboriladi. Narx bazadan.
      const regionDisplay = `${t(clientRegion)} — ${clientAddress}`;

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((it) => ({
            product_id: it.product.id,
            quantity: it.quantity,
          })),
          client: {
            name: clientName,
            phone: clientPhone,
            address: clientAddress,
            region: regionDisplay,
          },
          order_type: "full_payment",
        }),
      });

      const j = await res.json();
      if (!res.ok || !j.order_id) {
        throw new Error(j.error || "Buyurtmani saqlab bo'lmadi");
      }

      const newOrder = { id: j.order_id as string };
      // Click havolasidagi summa ham SERVER hisobidan olinadi.
      const serverTotal = Number(j.total_uzs);
      setSubmittedOrderId(newOrder.id);

      // Trigger Purchase Event (Client + Server Deduplicated)
      const purchaseEventId = `pur_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      trackMetaEvent(
        "Purchase",
        purchaseEventId,
        { client_name: clientName, client_phone: clientPhone },
        { value: serverTotal, currency: "UZS" }
      );

      // Trigger Lead / Contact Event (Client + Server Deduplicated)
      const leadEventId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      trackMetaEvent(
        "Lead",
        leadEventId,
        { client_name: clientName, client_phone: clientPhone }
      );

      setFinalAmount(serverTotal);
      setSubmitted(true);
      clearCart();
    } catch (err) {
      console.error(err);
      setCheckoutError(
        err instanceof Error && err.message
          ? err.message
          : "Buyurtmani rasmiylashtirib bo'lmadi. Internet aloqangizni tekshiring."
      );
      // ⚠️ Audit U2: loading FAQAT xatoda ochiladi. Muvaffaqiyatda
      // `submitted` ekraniga o'tiladi — oldin `finally` tugmani erta
      // ochib yuborardi va ikkinchi bosish YANGI buyurtma yaratardi.
      setLoading(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <>
        <Header />
        <main className="flex-1 pt-24 pb-24 md:pb-16 flex items-center justify-center">
          <div className="max-w-md mx-auto px-4 text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-gold-muted flex items-center justify-center mx-auto animate-scale-in">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gold-dark">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              {t("cart_success_title")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("cart_success_desc")}
            </p>


            {/* Click Payment Options */}
            <div className="glass-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider text-center">Onlayn To'lov</h3>
              <p className="text-[10px] text-muted-foreground text-center -mt-2 mb-3">To'lovni uyingizdan chiqmasdan, xavfsiz amalga oshiring</p>
              
              <a 
                href={`https://my.click.uz/services/pay?service_id=${process.env.NEXT_PUBLIC_CLICK_SERVICE_ID || '0'}&merchant_id=${process.env.NEXT_PUBLIC_CLICK_MERCHANT_ID || '0'}&amount=${finalAmount}&transaction_param=${submittedOrderId}&return_url=https://parfumelux.uz/payment-success`}
                className="btn btn-block btn-sm bg-[#00A1F1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_18px_-6px_rgba(0,161,241,0.45)] hover:bg-[#0090D8]"
              >
                {/* Minimal Click Logo SVG */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                Click orqali to'lash
              </a>

              <a 
                href={`https://my.click.uz/services/pay?service_id=${process.env.NEXT_PUBLIC_CLICK_SERVICE_ID || '0'}&merchant_id=${process.env.NEXT_PUBLIC_CLICK_MERCHANT_ID || '0'}&amount=${finalAmount}&transaction_param=${submittedOrderId}&card_type=uzcard&return_url=https://parfumelux.uz/payment-success`}
                className="btn btn-primary btn-block btn-sm"
              >
                {/* Generic Credit Card SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
                Karta bilan to'lash (Uzcard/Humo)
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/catalog"
                className="btn btn-outline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                {t("cart_back_btn")}
              </Link>
            </div>
          </div>
        </main>
        <BottomNav />
        <div className="h-20 md:hidden" />
      </>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="flex-1 pt-24 pb-24 md:pb-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="space-y-4 mb-8">
              <h1 className="font-heading text-3xl font-bold">
                <span className="text-foreground">{t("cart")}</span>
              </h1>
              <div className="flex items-center gap-2">
                <div className="w-12 h-px bg-gradient-to-r from-gold/50 to-transparent" />
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
              </div>
            </div>
            <div className="glass-card p-12 text-center space-y-6 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-gold-muted flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-gold-dark">
                  <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">{t("cart_empty_title")}</h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{t("cart_empty_desc")}</p>
              </div>
              <Link href="/catalog" className="btn btn-primary">
                {t("cart_go_catalog")}
              </Link>
            </div>
          </div>
        </main>
        <BottomNav />
        <div className="h-20 md:hidden" />
      </>
    );
  }

  // Cart with items
  return (
    <>
      <Header />
      <main className="flex-1 pt-24 pb-24 md:pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Page header */}
          <div className="space-y-4">
            <h1 className="font-heading text-3xl font-bold">
              <span className="text-foreground">{t("cart")}</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-12 h-px bg-gradient-to-r from-gold/50 to-transparent" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            </div>
          </div>

          {/* Cart Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="glass-card p-4 flex gap-4 items-center animate-fade-in">
                <div className="relative w-16 h-20 overflow-hidden bg-surface-image flex-shrink-0">
                  <Image src={item.product.image_url || "/products/default.png"} alt={item.product.title} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="text-sm font-semibold text-foreground truncate">{item.product.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="eyebrow px-2 py-1 border border-border text-muted-foreground">
                      {item.product.product_type === "original" ? "Original" : "Lyuks Premium"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    {item.product.product_type === "original" ? formatUzs(calculateOriginalPriceUzs(item.product.price_usd)) : formatUzs(calculatePremiumPriceUzs(item.product.price_usd))} so'm
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="btn-icon w-11">−</button>
                  <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="btn-icon w-11">+</button>
                </div>
                <button onClick={() => removeItem(item.product.id)} className="btn-icon w-11 border-transparent bg-transparent shadow-none hover:text-destructive">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>
                </button>
              </div>
            ))}
          </div>


          {/* Checkout Form */}
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t("cart_order_details")}</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="client-name" className="text-xs text-muted-foreground">{t("cart_name")}</label>
                <input id="client-name" type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="field w-full" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="client-phone" className="text-xs text-muted-foreground">{t("cart_phone")}</label>
                <input id="client-phone" type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+998 XX XXX XX XX" className="field w-full" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="client-region" className="text-xs text-muted-foreground">{t("cart_region")}</label>
                <div className="relative">
                  <select id="client-region" value={clientRegion} onChange={(e) => setClientRegion(e.target.value)} className="field w-full appearance-none">
                    <option value="" disabled>{t("cart_region_placeholder")}</option>
                    {REGIONS.map((region) => (<option key={region} value={region}>{t(region)}</option>))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="client-address" className="text-xs text-muted-foreground">{t("cart_address")}</label>
                <input id="client-address" type="text" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="field w-full" />
              </div>

            </div>
          </div>

          {/* Total + CTA */}
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("cart_total_price")}:</span>
              <span className="text-sm text-muted-foreground line-through"></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-foreground">
                {t("cart_payable_amount")}:
              </span>
              <span className="text-2xl font-semibold text-foreground tabular-nums">{formatUzs(paymentAmount)} so'm</span>
            </div>

            {checkoutError && (
              <div className="p-4 bg-destructive/8 border border-destructive/25 space-y-3">
                <p className="text-xs text-destructive leading-relaxed">{checkoutError}</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="btn btn-primary btn-block"
                  >
                    Qayta urinib ko&apos;rish
                  </button>
                  <a
                    href={`tel:${siteConfig.phone.replace(/s/g, "")}`}
                    className="btn btn-ghost btn-block no-underline text-center"
                  >
                    Do&apos;kon bilan bog&apos;lanish: {siteConfig.phone}
                  </a>
                </div>
              </div>
            )}

            <button
              id="checkout-btn"
              onClick={handleCheckout}
              disabled={loading || !clientName.trim() || !clientPhone.trim() || !clientAddress.trim() || !clientRegion}
              className="btn btn-primary btn-block
                         hover:opacity-90 active:scale-[0.98] transition-all duration-300
                         shadow-xl shadow-gold/25 hover:shadow-gold/40
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {t("cart_btn_checkout")}
                </>
              )}
            </button>

            {/* Uzum Nasiya Checkout Button — faqat kalit sozlanganda ko'rinadi */}
            {process.env.NEXT_PUBLIC_UZUM_ENABLED === "true" && (
            <button
              id="uzum-checkout-btn"
              onClick={handleUzumCheckout}
              disabled={loading || !clientName.trim() || !clientPhone.trim() || !clientAddress.trim() || !clientRegion}
              className="btn btn-uzum btn-block
                         hover:bg-[#5000E0] active:scale-[0.98] transition-all duration-300
                         shadow-lg shadow-[#6100FF]/25
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                         flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Uzum Nasiya (Bo'lib to'lash)</span>
                </>
              )}
            </button>
            )}
          </div>

          {/* Telegram Channel */}
          <div className="text-center py-4">
            <a href={siteConfig.telegramChannel} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              📢 {siteConfig.siteName}
            </a>
          </div>
        </div>
      </main>
      <BottomNav />
      <div className="h-20 md:hidden" />
      {showUzum && (
        <UzumCheckout
          initialPhone={clientPhone}
          client={{
            name: clientName,
            phone: clientPhone,
            address: clientAddress,
            region: t(clientRegion),
          }}
          onClose={() => setShowUzum(false)}
        />
      )}
    </>
  );
}
