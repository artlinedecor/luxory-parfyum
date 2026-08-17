"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart } from "lucide-react";
import { Product } from "@/lib/types";
import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useWishlist } from "@/lib/wishlist-context";
import {
  getFragranceView,
  formatVolumeShort,
  CONCENTRATION_SHORT,
} from "@/lib/fragrance";
import {
  calculateOriginalPriceUzs,
  calculatePremiumPriceUzs,
  formatUzs,
} from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  onQuickView,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isOriginal = product.product_type === "original";
  const { t, lang } = useI18n();
  const wishlist = useWishlist();

  const frag = getFragranceView(product);
  const saved = wishlist.has(product.id);

  // Ruscha nom bo'lsa — o'shani ko'rsatamiz, aks holda ajratilgan atir nomi
  const displayName =
    lang === "ru" && product.title_ru ? product.title_ru : frag.name;

  const priceUzs = isOriginal
    ? calculateOriginalPriceUzs(product.price_usd)
    : calculatePremiumPriceUzs(product.price_usd);

  const primarySrc = imageError
    ? "/products/default.png"
    : product.image_url || "/products/default.png";
  // Ikkinchi rakurs faqat bazada bo'lsa chiziladi (soxta rasm yo'q)
  const secondSrc = !imageError ? product.image_url_2 : null;

  const href = `/catalog/${product.id}`;

  return (
    <article className="group lux-card glass-card overflow-hidden flex flex-col h-full w-full">
      {/* ── Rasm: 3:4 vertikal, issiq oq fon ──────────────────────
          Havola rasm ustidagi qatlam sifatida qo'yilgan: shunda
          sevimlilar tugmasi havola ICHIDA bo'lmaydi (tugmani havola
          ichiga joylash noto'g'ri va bosilganda sahifa ochilib ketardi). */}
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-image flex-shrink-0">
        {!imageLoaded && <div className="absolute inset-0 z-[1] shimmer" />}

        <Image
          src={primarySrc}
          alt={`${frag.brand ? frag.brand + " " : ""}${displayName} — atir`}
          fill
          loading="lazy"
          className={`object-cover transition-[transform,opacity] duration-500 ease-out
                      group-hover:scale-[1.03]
                      ${secondSrc ? "group-hover:opacity-0" : ""}
                      ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onError={() => {
            if (!imageError) setImageError(true);
            setImageLoaded(true);
          }}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Ikkinchi rakurs — sichqoncha kelganda silliq almashadi */}
        {secondSrc && (
          <Image
            src={secondSrc}
            alt=""
            aria-hidden
            fill
            loading="lazy"
            className="object-cover opacity-0 scale-[1.03] transition-opacity duration-500 ease-out group-hover:opacity-100"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        )}

        {/* Rasmni bosish — mahsulot sahifasiga */}
        <Link
          id={`product-${product.id}`}
          href={href}
          aria-label={displayName}
          className="absolute inset-0 z-[2]"
        />

        {/* Yuqori chapda — konsentratsiya */}
        {frag.concentration && (
          <span className="absolute top-3 left-3 z-[3] eyebrow px-2 py-1 bg-white/85 text-foreground/80 backdrop-blur-[2px] pointer-events-none">
            {CONCENTRATION_SHORT[frag.concentration]}
          </span>
        )}

        {/* Yuqori o'ngda — hajm */}
        {frag.volumeMl && (
          <span className="absolute top-3 right-3 z-[3] eyebrow px-2 py-1 bg-white/85 text-muted-foreground backdrop-blur-[2px] pointer-events-none">
            {formatVolumeShort(frag.volumeMl)}
          </span>
        )}

        {/* Original belgisi — pastki chapda */}
        {isOriginal && (
          <span className="absolute bottom-3 left-3 z-[3] eyebrow px-2 py-1 bg-gradient-gold text-[#1a1a1a] pointer-events-none">
            Original
          </span>
        )}

        {/* Sevimlilar — rasm ustida. Ilgari pastdagi qatorda edi va
            telefonda "Savatchaga" yozuvini siqib, uni kesib qo'yardi. */}
        <button
          onClick={() => wishlist.toggle(product.id)}
          aria-label={lang === "ru" ? "В избранное" : "Sevimlilarga"}
          aria-pressed={saved}
          title={lang === "ru" ? "В избранное" : "Sevimlilarga"}
          className={`absolute bottom-3 right-3 z-[3] flex h-10 w-10 items-center justify-center
                      rounded-full border backdrop-blur-[2px] transition-colors duration-300
                      ${
                        saved
                          ? "border-gold bg-white/90 text-gold-dark"
                          : "border-black/10 bg-white/80 text-foreground/60 hover:text-foreground"
                      }`}
        >
          <Heart
            className="h-4 w-4"
            strokeWidth={1.5}
            fill={saved ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* ── Matn qismi ──────────────────────────────────────────── */}
      <Link href={href} className="flex flex-col flex-grow px-4 pt-4 pb-3 text-left">
        {frag.brand && (
          <p className="eyebrow text-muted-foreground line-clamp-1">{frag.brand}</p>
        )}

        <h3 className="font-heading mt-1.5 text-[17px] leading-snug text-foreground line-clamp-2 group-hover:text-gold-dark transition-colors duration-300">
          {displayName}
        </h3>

        {/* Asosiy akkordlar — faqat haqiqiy ma'lumot bo'lsa */}
        {frag.accords && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {frag.accords.slice(0, 3).map((a) => (
              <span
                key={a.name}
                className="text-[10px] leading-none px-2 py-1 border border-border text-muted-foreground"
              >
                {a.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[17px] font-semibold text-foreground tracking-tight tabular-nums">
              {formatUzs(priceUzs)}
            </span>
            <span className="eyebrow text-muted-foreground">
              {lang === "ru" ? "сум" : "so'm"}
            </span>
          </div>
        </div>
      </Link>

      {/* ── Harakatlar ──────────────────────────────────────────── */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <button
          onClick={() => {
            onAddToCart?.(product);
            const eid = `atc_${Date.now()}_${Math.random()
              .toString(36)
              .slice(2, 9)}`;
            import("@/lib/meta-tracker").then(({ trackMetaEvent }) => {
              trackMetaEvent(
                "AddToCart",
                eid,
                {},
                {
                  content_ids: [product.id],
                  content_name: product.title,
                  content_type: "product",
                  value: priceUzs,
                  currency: "UZS",
                }
              );
            });
          }}
          className="btn btn-outline btn-sm flex-1 px-2"
        >
          {t("btn_add_cart")}
        </button>

        {/* Tezkor ko'rish — faqat kengroq ekranda. Telefonda kartochkani
            bosish baribir mahsulot sahifasini ochadi, tugma esa joy egallab
            "Savatchaga" yozuvini kesib qo'yardi. */}
        {onQuickView && (
          <button
            onClick={() => onQuickView(product)}
            aria-label={lang === "ru" ? "Быстрый просмотр" : "Tezkor ko'rish"}
            title={lang === "ru" ? "Быстрый просмотр" : "Tezkor ko'rish"}
            className="btn-icon hidden sm:inline-flex"
          >
            <Eye className="w-4 h-4" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </article>
  );
}
