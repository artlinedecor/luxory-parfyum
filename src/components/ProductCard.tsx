"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { useState } from "react";
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const isOriginal = product.product_type === "original";
  const { t, lang } = useI18n();

  const displayTitle = lang === 'ru' && product.title_ru ? product.title_ru : product.title;
  const displayDesc = lang === 'ru' && product.description_ru ? product.description_ru : product.description;

  return (
    <Link
      id={`product-${product.id}`}
      href={`/catalog/${product.id}`}
      className="group relative glass-card rounded-2xl overflow-hidden transition-all duration-500 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 cursor-pointer flex flex-col h-full w-full text-left"
    >
      {/* Product Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary flex-shrink-0">
        {/* Shimmer skeleton while image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 z-[1] shimmer bg-secondary" />
        )}
        <Image
          src={imageError ? "/products/default.png" : (product.image_url || "/products/default.png")}
          alt={`${displayTitle} — Original va Super Klon atir do'koni`}
          fill
          loading="lazy"
          quality={65}
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
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
              {lang === 'ru' ? 'Супер Клон' : 'Super Klon'}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-heading text-sm font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-gold transition-colors duration-300">
          {displayTitle}
        </h3>
        
        {displayDesc && (
          <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
            {displayDesc}
          </p>
        )}

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
                e.preventDefault();
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
                e.preventDefault();
                e.stopPropagation();
                onAddToCart?.(product);
                // AddToCart pixel event
                const eid = `atc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
                import("@/lib/meta-tracker").then(({ trackMetaEvent }) => {
                  trackMetaEvent("AddToCart", eid, {}, {
                    content_ids: [product.id],
                    content_name: product.title,
                    content_type: "product",
                    value: product.price_usd,
                    currency: "USD",
                  });
                });
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider
                         hover:bg-gold/10 active:scale-[0.98] transition-all duration-300"
            >
              {t("btn_add_cart")}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
