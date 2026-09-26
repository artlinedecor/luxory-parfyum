"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Product } from "@/lib/types";
import { useI18n } from "@/lib/i18n-context";
import { getFragranceView } from "@/lib/fragrance";
import { calculateOriginalPriceUzs, calculatePremiumPriceUzs, formatUzs } from "@/lib/utils";

interface StockCarouselProps {
  products: Product[];
}

/**
 * Tanlangan atirlar — surib ko'riladigan gorizontal lenta (Embla).
 *
 * Ilgari bu cheksiz CSS marquee edi: doim harakatlanib turardi va
 * kartochkani o'qish uchun sichqonchani ushlab turish kerak edi.
 * Endi foydalanuvchi o'zi suradi — bosim yo'q, lyuks uslubga mos.
 */
export default function StockCarousel({ products }: StockCarouselProps) {
  const { t, lang } = useI18n();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
    loop: false,
  });

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    // Embla — tashqi tizim; strelkalarning holatini undan o'qiymiz.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Omborda bor, rasmi bor atirlar — "Barcha atirlar" ro'yxatini takrorlamaydi
  const featured = products.filter((p) => p.image_url && (p.stock ?? 0) > 0).slice(0, 16);

  // Mahsulotlar hali yuklanmagan — joyni oldindan band qilamiz. Aks holda lenta
  // keyin paydo bo'lib, pastdagi bloklarni itarib yuborardi (Lighthouse CLS 0.515).
  if (products.length === 0) {
    return (
      <section aria-hidden className="relative py-10 sm:py-14 border-y border-border bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <p className="eyebrow text-muted-foreground">{t("hotstock_subtitle")}</p>
          <h2 className="font-heading mt-2 text-3xl sm:text-4xl text-foreground">{t("hotstock_title")}</h2>
        </div>
        <div className="overflow-hidden px-4 sm:px-6 lg:px-8">
          <div className="flex gap-5 max-w-7xl mx-auto">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="shrink-0 w-[10.5rem] sm:w-48">
                <div className="aspect-[3/4] rounded-xl border border-border bg-surface-image shimmer" />
                <div className="pt-3.5 space-y-2">
                  <div className="h-3 w-16 rounded bg-border/60" />
                  <div className="h-[2.3rem] rounded bg-border/40" />
                  <div className="h-4 w-24 rounded bg-border/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  if (featured.length < 3) return null;

  const arrow =
    "w-10 h-10 flex items-center justify-center border border-border text-muted-foreground " +
    "hover:text-foreground hover:border-foreground/30 disabled:opacity-30 " +
    "disabled:hover:text-muted-foreground disabled:hover:border-border transition-colors duration-300";

  return (
    <section id="tanlangan" className="relative py-10 sm:py-14 border-y border-border bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-muted-foreground">{t("hotstock_subtitle")}</p>
          <h2 className="font-heading mt-2 text-3xl sm:text-4xl text-foreground">
            {t("hotstock_title")}
          </h2>
        </div>

        {/* Strelkalar — faqat kompyuterda, telefonda barmoq bilan suriladi */}
        <div className="hidden md:flex gap-2 shrink-0">
          <button
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            aria-label={lang === "ru" ? "Назад" : "Orqaga"}
            className={arrow}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            aria-label={lang === "ru" ? "Вперёд" : "Oldinga"}
            className={arrow}
          >
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden px-4 sm:px-6 lg:px-8" ref={emblaRef}>
        <div className="flex gap-5 max-w-7xl mx-auto">
          {featured.map((p) => {
            const frag = getFragranceView(p);
            const name =
              lang === "ru" && p.title_ru ? p.title_ru : frag.name;

            return (
              <Link
                key={p.id}
                href={`/catalog/${p.id}`}
                className="group/card shrink-0 w-[10.5rem] sm:w-48"
              >
                <div className="relative aspect-[3/4] bg-surface-image overflow-hidden rounded-xl border border-border group-hover/card:border-gold/50 transition-colors duration-500">
                  <Image
                    src={p.image_url || "/products/default.png"}
                    alt={name}
                    fill
                    loading="lazy"
                    className="object-contain p-2 transition-transform duration-[600ms] ease-out group-hover/card:scale-[1.04]"
                    sizes="(max-width: 640px) 168px, 192px"
                  />
                </div>

                <div className="pt-3.5">
                  {frag.brand && (
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground truncate">
                      {frag.brand}
                    </p>
                  )}
                  <p className="mt-1 text-[14px] font-semibold leading-tight text-foreground line-clamp-2 min-h-[2.3rem] group-hover/card:text-gold-dark transition-colors duration-300">
                    {name}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-foreground tabular-nums">
                    {/* Oldin har doim klon narxi chiqardi — original atirlar ham 800 000 ko'rinardi */}
                    {formatUzs(p.product_type === "original" ? calculateOriginalPriceUzs(p.price_usd) : calculatePremiumPriceUzs(p.price_usd))}{" "}
                    <span className="eyebrow text-muted-foreground font-normal">
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
