"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { siteConfig } from "@/config/site";
import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { createClient } from "@/utils/supabase/client";

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
  const [loading, setLoading] = useState(false);

  const hasOriginal = items.some(
    (item) => item.product.product_type === "original"
  );

  // Calculate actual payment amount
  const paymentAmount = items.reduce((sum, item) => {
    if (item.product.product_type === "original") {
      return sum + siteConfig.depositAmount * item.quantity;
    }
    return sum + item.product.price_usd * item.quantity;
  }, 0);

  const handleCheckout = async () => {
    if (!clientName.trim() || !clientPhone.trim() || !clientAddress.trim() || !clientRegion) return;

    setLoading(true);

    try {
      const supabase = createClient();
      
      // 1. Insert into Supabase
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_purchase: item.product.price_usd,
        title: item.product.title,
        product_type: item.product.product_type
      }));

      const { error } = await supabase.from('orders').insert({
        merchant_id: items[0]?.product.merchant_id || "m1", // Should match current tenant
        items: orderItems,
        client_name: clientName,
        client_phone: clientPhone,
        region: t(clientRegion), // Save localized region name
        order_type: hasOriginal ? "deposit_50" : "full_payment",
        status: "pending"
      });

      if (error) {
        console.error("Supabase insert error:", error);
        alert("Buyurtmani saqlashda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
        setLoading(false);
        return;
      }

      // 2. Generate Telegram Message
      const productLines = items
        .map((item) => {
          const type = item.product.product_type === "original" ? "Original" : "Lux";
          const price = item.product.product_type === "original"
              ? `$${siteConfig.depositAmount} zaklad`
              : `$${item.product.price_usd}`;
          return `- ${item.product.title} (${type}) x${item.quantity} - ${price}`;
        })
        .join("\n");

      const paymentType = hasOriginal ? `$${paymentAmount} ($${siteConfig.depositAmount} zaklad)` : `$${paymentAmount} (to'liq narx)`;

      const message = `🛍 YANGI BUYURTMA!
👤 Mijoz: ${clientName}
📞 Telefon: ${clientPhone}
📍 Viloyat: ${t(clientRegion)}
📍 Manzil: ${clientAddress}

📦 Tanlangan Atirlar:
${productLines}

💰 Jami Summa: ${paymentType}
💳 To'langan Karta: ${siteConfig.paymentCard} (${siteConfig.paymentCardHolder})

📎 Iltimos, ushbu xabarga to'lov chekining (skrinshotini) biriktirib adminga yuboring!`;

      // 3. Encode and open Telegram
      const encodedMessage = encodeURIComponent(message);
      const telegramUrl = `https://t.me/${siteConfig.telegramAdminUsername}?text=${encodedMessage}`;
      
      window.open(telegramUrl, "_blank");

      setSubmitted(true);
      clearCart();
    } catch (err) {
      console.error(err);
      alert("Xatolik yuz berdi.");
    } finally {
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10 text-gold">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              {t("cart_success_title")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("cart_success_desc")}
            </p>
            <div className="glass-card rounded-xl p-4 space-y-2">
              <p className="text-xs text-muted-foreground">{t("cart_payment_card")}:</p>
              <p className="text-gold font-mono font-bold text-lg tracking-wider">
                {siteConfig.paymentCard}
              </p>
              <p className="text-xs text-muted-foreground">
                {siteConfig.paymentCardHolder}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href={siteConfig.telegramAdmin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#0088cc] text-white font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                {t("cart_send_check_btn")}
              </a>
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-gold/30 text-gold font-semibold text-sm hover:bg-gold/10 transition-all"
              >
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
                <span className="text-gradient-gold">{t("cart")}</span>
              </h1>
              <div className="flex items-center gap-2">
                <div className="w-12 h-px bg-gradient-to-r from-gold/50 to-transparent" />
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-12 text-center space-y-6 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-gold-muted flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gold">
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("cart_empty_title")}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {t("cart_empty_desc")}
                </p>
              </div>
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-gold text-black font-bold text-sm uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all duration-300 shadow-lg shadow-gold/20"
              >
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
              <span className="text-gradient-gold">{t("cart")}</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-12 h-px bg-gradient-to-r from-gold/50 to-transparent" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            </div>
          </div>

          {/* Cart Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="glass-card rounded-xl p-4 flex gap-4 items-center animate-fade-in"
              >
                {/* Product Image */}
                <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  <Image
                    src={item.product.image_url || "/products/default.png"}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {item.product.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold font-semibold uppercase">
                      {item.product.product_type === "original"
                        ? "Original"
                        : "Lux"}
                    </span>
                    {item.product.product_type === "original" && (
                      <span className="text-[10px] text-gold font-medium">
                        ${siteConfig.depositAmount} zaklad
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gradient-gold">
                    $
                    {item.product.product_type === "original"
                      ? siteConfig.depositAmount
                      : item.product.price_usd}
                  </p>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity - 1)
                    }
                    className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-gold/30 transition-all"
                  >
                    −
                  </button>
                  <span className="text-sm font-semibold w-5 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity + 1)
                    }
                    className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-gold/30 transition-all"
                  >
                    +
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Payment Card Info */}
          <div className="glass-card rounded-xl p-4 space-y-2 shimmer">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t("cart_payment_card")}</p>
            <p className="text-gold font-mono font-bold text-xl tracking-wider">
              {siteConfig.paymentCard}
            </p>
            <p className="text-xs text-muted-foreground">{siteConfig.paymentCardHolder}</p>
          </div>

          {/* Checkout Form */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {t("cart_order_details")}
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="client-name" className="text-xs text-muted-foreground">{t("cart_name")}</label>
                <input
                  id="client-name"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="client-phone" className="text-xs text-muted-foreground">{t("cart_phone")}</label>
                <input
                  id="client-phone"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+998 XX XXX XX XX"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="client-region" className="text-xs text-muted-foreground">{t("cart_region")}</label>
                <div className="relative">
                  <select
                    id="client-region"
                    value={clientRegion}
                    onChange={(e) => setClientRegion(e.target.value)}
                    className="w-full px-4 py-3 appearance-none rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
                  >
                    <option value="" disabled>{t("cart_region_placeholder")}</option>
                    {REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {t(region)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="client-address" className="text-xs text-muted-foreground">{t("cart_address")}</label>
                <input
                  id="client-address"
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Total + CTA */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("cart_total_price")}:</span>
              <span className="text-sm text-muted-foreground line-through">${totalPrice}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-foreground">
                {hasOriginal ? t("cart_payable_amount") + ":" : t("cart_total") + ":"}
              </span>
              <span className="text-2xl font-bold text-gradient-gold">${paymentAmount}</span>
            </div>
            {hasOriginal && (
              <p className="text-[10px] text-gold/70 leading-relaxed">
                {t("cart_deposit_note")}
              </p>
            )}

            <button
              id="checkout-btn"
              onClick={handleCheckout}
              disabled={loading || !clientName.trim() || !clientPhone.trim() || !clientAddress.trim() || !clientRegion}
              className="w-full py-4 rounded-xl bg-gradient-gold text-black font-bold text-sm uppercase tracking-wider
                       hover:opacity-90 active:scale-[0.98] transition-all duration-300
                       shadow-xl shadow-gold/25 hover:shadow-gold/40
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                       flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  {t("cart_btn_checkout")}
                </>
              )}
            </button>
          </div>

          {/* Telegram Channel */}
          <div className="text-center py-4">
            <a
              href={siteConfig.telegramChannel}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-gold transition-colors"
            >
              📢 {siteConfig.siteName}
            </a>
          </div>
        </div>
      </main>
      <BottomNav />
      <div className="h-20 md:hidden" />
    </>
  );
}
