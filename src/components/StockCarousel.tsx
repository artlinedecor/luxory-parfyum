"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { useI18n } from "@/lib/i18n-context";
import { calculatePremiumPriceUzs, formatUzs } from "@/lib/utils";

interface StockCarouselProps {
  products: Product[];
}

/**
 * Astatka (omborda bor) mahsulotlarni doimiy aylanuvchi banner —
 * "tez sotilar" maqsadida diqqatni tortadi.
 */
export default function StockCarousel({ products }: StockCarouselProps) {
  const { t, lang } = useI18n();

  const inStock = products
    .filter((p) => (Number(p.stock) || 0) > 0)
    .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0)); // kam qolganlar oldinda

  if (inStock.length === 0) return null;

  // Uzluksiz aylanma uchun ro'yxatni ikki marta takrorlaymiz
  const loop = [...inStock, ...inStock];

  return (
    <section className="relative py-8 overflow-hidden border-y border-gold/15 bg-gradient-to-r from-gold/[0.03] via-gold/[0.07] to-gold/[0.03]">
      {/* Heading */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl animate-pulse">🔥</span>
          <div>
            <h3 className="font-heading text-lg sm:text-xl font-bold text-gradient-gold leading-tight">
              {t("hotstock_title")}
            </h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              {t("hotstock_subtitle")}
            </p>
          </div>
        </div>
        <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {inStock.length} {lang === "ru" ? "шт" : "ta"}
        </span>
      </div>

      {/* Marquee track */}
      <div className="marquee-mask group">
        <div className="flex gap-4 w-max animate-marquee group-hover:[animation-play-state:paused] px-4">
          {loop.map((p, i) => {
            const title = lang === "ru" && p.title_ru ? p.title_ru : p.title;
            return (
              <Link
                key={`${p.id}-${i}`}
                href={`/catalog/${p.id}`}
                className="group/card relative flex-shrink-0 w-44 rounded-2xl overflow-hidden glass-card border border-gold/10 hover:border-gold/40 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-square bg-secondary overflow-hidden">
                  <Image
                    src={p.image_url || "/products/default.png"}
                    alt={title}
                    fill
                    quality={60}
                    className="object-cover transition-transform duration-500 group-hover/card:scale-110"
                    sizes="176px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {/* Bo'lib to'lash belgisi */}
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg bg-green-500/90 text-black">
                    💳 {t("installment_short")}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight min-h-[2rem] group-hover/card:text-gold transition-colors">
                    {title}
                  </p>
                  <p className="mt-1.5 text-sm font-bold text-gradient-gold">
                    {formatUzs(calculatePremiumPriceUzs(p.price_usd))}{" "}
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {lang === "ru" ? "сум" : "so'm"}
                    </span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
