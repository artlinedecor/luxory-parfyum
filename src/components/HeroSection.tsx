"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

export default function HeroSection() {
  const { t } = useI18n();

  return (
    <section
      id="hero"
      className="relative min-h-[85vh] md:min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/hero.png"
          alt="Luxury perfume"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Dark overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gold/5 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-gold/5 blur-[80px]" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-8">
        {/* Subtle label */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/20 bg-gold/5 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-gold text-xs font-medium tracking-widest uppercase">
            {t("hero_badge")}
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl font-bold leading-tight tracking-tight">
          <span className="text-foreground">{t("hero_title_1")} </span>
          <span className="text-gradient-gold">{t("hero_title_2")}</span>
          <br />
          <span className="text-foreground">{t("hero_title_3")}</span>
        </h1>

        {/* Description */}
        <p className="max-w-xl mx-auto text-muted-foreground text-sm sm:text-base leading-relaxed">
          {t("hero_desc")}
        </p>

        {/* Delivery Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
          <span className="text-green-400 text-xs sm:text-sm font-medium">
            {t("hero_delivery_badge")}
          </span>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/catalog"
            id="hero-cta-catalog"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-gold text-black font-bold text-sm uppercase tracking-wider
                       hover:opacity-90 active:scale-[0.98] transition-all duration-300
                       shadow-xl shadow-gold/25 hover:shadow-gold/40"
          >
            {t("btn_catalog")}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </Link>

          <Link
            href="/catalog?type=original"
            id="hero-cta-original"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-gold/30 text-gold font-semibold text-sm uppercase tracking-wider
                       hover:bg-gold/10 transition-all duration-300"
          >
            {t("btn_original")}
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 pt-8">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gradient-gold">500+</div>
            <div className="text-xs text-muted-foreground mt-1">{t("stats_products")}</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gradient-gold">50+</div>
            <div className="text-xs text-muted-foreground mt-1">{t("stats_brands")}</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gradient-gold">24/7</div>
            <div className="text-xs text-muted-foreground mt-1">{t("stats_support")}</div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60">
        <span className="text-[10px] text-muted-foreground tracking-widest uppercase">{t("hero_scroll")}</span>
        <div className="w-5 h-8 rounded-full border border-gold/30 flex items-start justify-center p-1.5">
          <div className="w-1 h-2 rounded-full bg-gold animate-bounce" />
        </div>
      </div>
    </section>
  );
}
