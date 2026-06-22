"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Product } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [added, setAdded] = useState(false);
  
  const { addItem } = useCart();
  const { t, lang } = useI18n();

  const displayTitle = lang === "ru" && product.title_ru ? product.title_ru : product.title;
  const displayDesc = lang === "ru" && product.description_ru ? product.description_ru : product.description;
  const isOriginal = product.product_type === "original";

  const handleAddToCart = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        {/* Back Link */}
        <div>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {lang === "ru" ? "Назад в каталог" : "Katalogga qaytish"}
          </Link>
        </div>

        {/* Product details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Product Image */}
          <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-secondary border border-gold/10 shadow-2xl shadow-gold/5 backdrop-blur-sm">
            {!imageLoaded && <div className="absolute inset-0 z-[1] shimmer bg-secondary" />}
            <Image
              src={imageError ? "/products/default.png" : (product.image_url || "/products/default.png")}
              alt={displayTitle}
              fill
              priority
              className={`object-cover transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={() => setImageError(true)}
              onLoad={() => setImageLoaded(true)}
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            
            {/* Absolute badge */}
            <div className="absolute top-4 left-4 z-10">
              {isOriginal ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-gold text-black text-xs font-bold uppercase tracking-wider shadow-lg shadow-gold/20">
                  ⚡ Premium Original
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-wider border border-white/15">
                  {lang === "ru" ? "Супер Клон" : "Super Klon"}
                </span>
              )}
            </div>
          </div>

          {/* Right: Info Column */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                  {isOriginal ? (lang === "ru" ? "Оригинал под заказ" : "Buyurtma asosida original") : (lang === "ru" ? "Копия высшего качества" : "Oliy toifali klon")}
                </span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {displayTitle}
              </h1>
              <div className="flex items-baseline gap-2 pt-2">
                <span className="text-3xl font-extrabold text-gradient-gold">${product.price_usd}</span>
                {isOriginal && (
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">USD</span>
                )}
              </div>
            </div>

            <hr className="border-border/50" />

            {/* Product Actions */}
            <div className="space-y-4">
              {isOriginal ? (
                <div className="space-y-3">
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-4 rounded-2xl bg-gradient-gold text-black text-sm font-bold uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all duration-300 shadow-xl shadow-gold/10"
                  >
                    {added ? t("btn_added") : t("btn_order_deposit")}
                  </button>
                  <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
                    {lang === "ru" 
                      ? "* Оригинальные ароматы доставляются на заказ с депозитом $50." 
                      : "* Original atirlar buyurtma asosida $50 zaklad bilan olib kelinadi."}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 rounded-2xl border border-gold/30 text-gold text-sm font-bold uppercase tracking-widest hover:bg-gold/10 active:scale-[0.98] transition-all duration-300"
                >
                  {added ? t("btn_added") : t("btn_add_cart")}
                </button>
              )}
            </div>

            {/* Description */}
            {displayDesc && (
              <div className="space-y-2 pt-4">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                  {lang === "ru" ? "Описание аромата" : "Atir tavsifi"}
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line font-normal">
                  {displayDesc}
                </p>
              </div>
            )}

            <hr className="border-border/50" />

            {/* Quick Benefits Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center text-gold flex-shrink-0 text-xs mt-0.5">✓</div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{t("features_fast_title")}</p>
                  <p className="text-[10px] text-muted-foreground">{t("features_fast_desc")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center text-gold flex-shrink-0 text-xs mt-0.5">✓</div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{t("features_quality_title")}</p>
                  <p className="text-[10px] text-muted-foreground">{t("features_quality_desc")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
