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
 * Tanlangan atirlar — doimiy aylanuvchi lyuks banner (diqqatni tortadi).
 */
export default function StockCarousel({ products }: StockCarouselProps) {
  const { t, lang } = useI18n();

  // Rasmi bor mahsulotlardan tanlangan to'plam
  // 24 ta emas 12 ta — takrorlangani bilan 24 element bo'ladi (mobil skroll uchun yengil)
  const featured = products.filter((p) => p.image_url).slice(0, 12);

  if (featured.length < 4) return null;

  // Uzluksiz aylanma uchun ro'yxatni ikki marta takrorlaymiz
  const loop = [...featured, ...featured];

  return (
    <section className="relative py-9 overflow-hidden border-y border-border bg-secondary/40">
      {/* Heading */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex items-center gap-3">
        <span className="text-xl">💎</span>
        <div>
          <h3 className="font-heading text-xl sm:text-2xl text-foreground leading-tight">
            {t("hotstock_title")}
          </h3>
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            {t("hotstock_subtitle")}
          </p>
        </div>
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
                className="group/card relative flex-shrink-0 w-44 overflow-hidden glass-card hover:border-gold/50 transition-colors duration-300"
              >
                <div className="relative aspect-square bg-surface-image overflow-hidden">
                  <Image
                    src={p.image_url || "/products/default.png"}
                    alt={title}
                    fill
                    quality={60}
                    className="object-cover transition-transform duration-500 group-hover/card:scale-110"
                    sizes="176px"
                  />
                  
                  {/* Bo'lib to'lash belgisi */}
                  <span className="absolute top-2 right-2 px-2 py-1 eyebrow bg-white/85 text-foreground/75">
                    💳 {t("installment_short")}
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-heading text-sm text-foreground line-clamp-2 leading-tight min-h-[2.2rem] group-hover/card:text-gold-dark transition-colors">
                    {title}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-foreground tabular-nums">
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
