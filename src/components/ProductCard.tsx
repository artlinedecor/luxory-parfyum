"use client";

import Image from "next/image";
import { Product } from "@/lib/types";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n-context";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onOrder?: (product: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  onOrder,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isOriginal = product.product_type === "original";
  const { t, lang } = useI18n();

  const displayTitle = lang === 'ru' && product.title_ru ? product.title_ru : product.title;
  const displayDesc = lang === 'ru' && product.description_ru ? product.description_ru : product.description;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return (
    <>
      <div
        id={`product-${product.id}`}
        onClick={() => setIsModalOpen(true)}
        className="group relative glass-card rounded-2xl overflow-hidden transition-all duration-500 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 cursor-pointer flex flex-col h-full"
      >
        {/* Product Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary flex-shrink-0">
          <Image
            src={imageError ? "/products/default.png" : (product.image_url || "/products/default.png")}
            alt={displayTitle}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImageError(true)}
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isOriginal ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-gold text-black text-[10px] font-bold uppercase tracking-wider shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                </svg>
                Premium
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-[10px] font-semibold uppercase tracking-wider">
                Lux Copy
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-heading text-sm font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-gold transition-colors duration-300">
            {displayTitle}
          </h3>

          <div className="mt-auto pt-3 flex flex-col gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gradient-gold">
                ${product.price_usd}
              </span>
              {isOriginal && (
                <span className="text-[10px] text-muted-foreground">USD</span>
              )}
            </div>

            {isOriginal ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOrder?.(product);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-gold text-black text-xs font-bold uppercase tracking-wider
                           hover:opacity-90 active:scale-[0.98] transition-all duration-300
                           shadow-lg shadow-gold/20 hover:shadow-gold/40"
              >
                {t("btn_order_deposit")}
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart?.(product);
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider
                           hover:bg-gold/10 active:scale-[0.98] transition-all duration-300"
              >
                {t("btn_add_cart")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Details (rendered via Portal to break out of transformed card grids) */}
      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" onClick={() => setIsModalOpen(false)}>
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <div 
            className="relative w-[92%] sm:w-full max-w-xl bg-[#0d0d0d] border border-gold/30 rounded-3xl overflow-hidden shadow-2xl shadow-gold/20 animate-scale-in max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/60 backdrop-blur-md rounded-full text-white/80 hover:text-white hover:bg-black/80 transition-colors shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {/* Scrollable container */}
            <div className="overflow-y-auto scrollbar-hide flex-1">
              {/* Image Section */}
              <div className="relative aspect-[4/3] w-full bg-secondary">
                <Image
                  src={imageError ? "/products/default.png" : (product.image_url || "/products/default.png")}
                  alt={displayTitle}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 600px"
                />
              </div>

              {/* Text details content */}
              <div className="px-6 pb-6 pt-2 space-y-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-2">
                    {isOriginal ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gradient-gold text-black text-[10px] font-bold uppercase tracking-wider">
                        Premium Original
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 text-white text-[10px] font-semibold uppercase tracking-wider border border-white/10">
                        Lux Copy
                      </span>
                    )}
                  </div>
                  <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug text-left">
                    {displayTitle}
                  </h2>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-gradient-gold">
                      ${product.price_usd}
                    </span>
                  </div>
                </div>

                {displayDesc && (
                  <div className="space-y-2 pt-4 border-t border-border/40 text-left">
                    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      {lang === 'ru' ? 'Описание' : 'Tavsif'}
                    </h4>
                    <p className="text-sm text-foreground/90 leading-relaxed font-normal whitespace-pre-line text-left">
                      {displayDesc}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action button sticky at the bottom */}
            <div className="p-4 bg-[#0d0d0d] border-t border-border/40 flex gap-3">
              {isOriginal ? (
                <button
                  onClick={() => {
                    onOrder?.(product);
                    setIsModalOpen(false);
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-gold text-black text-sm font-bold uppercase tracking-wider
                             hover:opacity-90 active:scale-[0.98] transition-all duration-300 shadow-lg shadow-gold/20"
                >
                  {t("btn_order_deposit")}
                </button>
              ) : (
                <button
                  onClick={() => {
                    onAddToCart?.(product);
                    setIsModalOpen(false);
                  }}
                  className="flex-1 py-3.5 rounded-xl border border-gold/30 text-gold text-sm font-bold uppercase tracking-wider
                             hover:bg-gold/10 active:scale-[0.98] transition-all duration-300"
                >
                  {t("btn_add_cart")}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
