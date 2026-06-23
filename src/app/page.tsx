"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import HeroSection from "@/components/HeroSection";
import ProductGrid from "@/components/ProductGrid";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { siteConfig } from "@/config/site";
import { useI18n } from "@/lib/i18n-context";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Product } from "@/lib/types";
import { trackMetaEvent } from "@/lib/meta-tracker";

import { useShopSettings } from "@/lib/settings-context";

export default function Home() {
  const { t } = useI18n();
  const { shopName, logoUrl, shopAddress, telegramAdminUsername, telegramChannel, shopPhone } = useShopSettings();
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          setProducts(data);
        }
      } catch (e) {
        console.error("Error fetching database products:", e);
      }
    };
    fetchProducts();
  }, []);

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Lux Atir",
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
        {/* Hero Section */}
        <HeroSection />

        {/* Featured Products */}
        <section id="featured-products" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12 space-y-4">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold">
              <span className="text-foreground">{t("collection_title_1")}</span>
              <span className="text-gradient-gold">{t("collection_title_2")}</span>
            </h2>
            <div className="relative py-5 px-6 max-w-2xl mx-auto my-6 rounded-2xl bg-gradient-to-r from-gold/5 via-gold/10 to-gold/5 border border-gold/25 shadow-xl shadow-gold/5 backdrop-blur-sm overflow-hidden shimmer">
              <p className="relative font-sans text-sm sm:text-base font-semibold tracking-wide text-gradient-gold animate-glow-shimmer leading-relaxed">
                ✨ {t("collection_desc")} ✨
              </p>
            </div>



            {/* Gold accent line */}
            <div className="flex items-center justify-center gap-2">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold/50" />
              <div className="w-2 h-2 rounded-full bg-gold" />
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold/50" />
            </div>
          </div>

          {/* Products with Tabs */}
          <ProductGrid products={products} />
        </section>

        {/* Features section */}
        <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="text-center space-y-3 group">
                <div className="w-14 h-14 rounded-2xl bg-gold-muted flex items-center justify-center mx-auto group-hover:bg-gold/20 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-gold">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{t("features_fast_title")}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("features_fast_desc")}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center space-y-3 group">
                <div className="w-14 h-14 rounded-2xl bg-gold-muted flex items-center justify-center mx-auto group-hover:bg-gold/20 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-gold">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{t("features_quality_title")}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("features_quality_desc")}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center space-y-3 group">
                <div className="w-14 h-14 rounded-2xl bg-gold-muted flex items-center justify-center mx-auto group-hover:bg-gold/20 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-gold">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{t("features_price_title")}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("features_price_desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="footer" className="py-10 px-4 sm:px-6 lg:px-8 border-t border-border bg-[#080808]">
          <div className="max-w-7xl mx-auto text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-gold flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-black font-bold text-[10px]">{siteConfig.logoInitial}</span>
                )}
              </div>
              <span className="font-heading text-lg font-semibold text-gradient-gold">
                {shopName}
              </span>
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
                className="text-muted-foreground hover:text-gold transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              <a
                href={`tel:${shopPhone.replace(/\s/g, '')}`}
                onClick={() => {
                  const leadEventId = `lead_phone_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                  trackMetaEvent("Lead", leadEventId);
                }}
                className="text-muted-foreground hover:text-gold transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" /></svg>
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground/50">
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
