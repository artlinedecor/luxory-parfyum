"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import HeroSection from "@/components/HeroSection";
import ProductGrid from "@/components/ProductGrid";
import StockCarousel from "@/components/StockCarousel";
import HowToBuy from "@/components/HowToBuy";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { siteConfig } from "@/config/site";
import { useI18n } from "@/lib/i18n-context";
import { useEffect, useState } from "react";
import { fetchCatalogProducts } from "@/lib/products-query";
import { Product } from "@/lib/types";
import { trackMetaEvent } from "@/lib/meta-tracker";

import { useShopSettings } from "@/lib/settings-context";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import Reveal from "@/components/motion/Reveal";

export default function Home() {
  const { t, lang } = useI18n();
  const { shopName, shopAddress, telegramAdminUsername, telegramChannel, shopPhone } = useShopSettings();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchCatalogProducts().then(setProducts);
  }, []);

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": siteConfig.siteName,
    "image": "https://parfumelux.uz/hero.png",
    "@id": "https://parfumelux.uz/#store",
    "url": "https://parfumelux.uz",
    "telephone": "+998 99 262 01 01",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Toshkent, O'zbekiston",
      "addressLocality": "Toshkent",
      "addressCountry": "UZ"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <Header />
      <main className="flex-1">
        {/*
          ⚠️ SEO: bu yerda h1 QO'SHMANG. HeroSection.tsx ichida
          allaqachon sahifaning yagona h1 tegi bor (matn + sr-only
          kalit so'zlar). Ikkinchi h1 qo'shilsa — duplikat H1 xatosi.

          Bu xato "AI Smart SEO Agent" (uzumbot.uz, GPT-4 asosida,
          har 6 soatda ishlaydi) tomonidan ikki marta avtomatik
          qo'shilgan edi (fbcb008, a0f72e3) — u HeroSection.tsx dagi
          h1 ni ko'rmay, "h1 yo'q" deb xato xulosa chiqargan va uni
          matn sifatida <main> tegi ICHIGA joylashtirib, JSX
          sintaksisini ham buzgan (butun sayt bir hafta deploy
          bo'lmadi). Bot yana ishga tushsa, xuddi shu xatoni yana
          qilishi mumkin — shuning uchun bu ogohlantirish qoldirilgan.
        */}
        <HeroSection productCount={products.length} products={products} />

        {/* Tanlangan atirlar — tez yetkazish mumkin bo'lganlar (qoldiq mijozga ko'rsatilmaydi) */}
        <StockCarousel products={products} />

        {/* Bo'lib to'lashga qanday olinadi — 3 qadam */}
        <HowToBuy />

        {/* Featured Products */}
        <section id="featured-products" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Section header */}
          <Reveal className="text-center mb-8 sm:mb-12 space-y-3 block">
            <h2 className="font-heading text-4xl sm:text-5xl text-foreground">
              {t("collection_title_1")}
              <span className="text-gold-dark">{t("collection_title_2")}</span>
            </h2>
            <p className="max-w-xl mx-auto text-sm text-muted-foreground leading-relaxed">
              {t("collection_desc")}
            </p>
            <div className="gold-hairline w-24 mx-auto" />
          </Reveal>

          {/* Products with Tabs */}
          <ProductGrid products={products} />
        </section>

        {/* Footer */}
        <footer id="footer" className="py-14 px-4 sm:px-6 lg:px-8 border-t border-border bg-secondary/30">
          <div className="max-w-7xl mx-auto text-center space-y-4">
            <div className="flex items-center justify-center gap-2.5">
              <BrandLogo size="sm" />
            </div>
            <p className="text-xs text-muted-foreground">
              {siteConfig.siteDescription} — {shopAddress}
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <a
                href={telegramChannel}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  const leadEventId = `lead_channel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                  trackMetaEvent("Lead", leadEventId);
                }}
                className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              <a
                href={`tel:${shopPhone.replace(/\s/g, '')}`}
                onClick={() => {
                  const leadEventId = `lead_phone_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                  trackMetaEvent("Lead", leadEventId);
                }}
                className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" /></svg>
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 text-[11px] text-muted-foreground/70">
              <Link href="/privacy-policy" className="inline-flex min-h-[44px] items-center px-2 hover:text-foreground transition-colors underline underline-offset-4">
                {lang === "uz" ? "Maxfiylik siyosati" : "Политика конфиденциальности"}
              </Link>
            </div>
            <p className="text-[11px] text-muted-foreground/60">
              © {new Date().getFullYear()} {shopName}. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </footer>
      </main>
      <BottomNav />

      {/* Bottom safe area spacer for mobile */}
      <div className="h-20 md:hidden" />
    </>
  );
}
