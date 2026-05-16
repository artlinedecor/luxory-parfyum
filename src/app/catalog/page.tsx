"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ProductGrid from "@/components/ProductGrid";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { siteConfig } from "@/config/site";
import { useI18n } from "@/lib/i18n-context";

export default function CatalogPage() {
  const { t } = useI18n();

  return (
    <>
      <Header />
      <main className="flex-1 pt-24 pb-24 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Page header */}
          <div className="text-center mb-10 space-y-4">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold">
              <span className="text-foreground">{t("catalog")} - </span>
              <span className="text-gradient-gold">{siteConfig.siteName}</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {t("collection_desc")}
            </p>
            <div className="flex justify-center items-center gap-2">
              <div className="w-12 h-px bg-gradient-to-r from-gold/50 to-transparent" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            </div>
          </div>

          {/* Products Grid */}
          <ProductGrid products={MOCK_PRODUCTS} />
        </div>
      </main>
      <BottomNav />
      <div className="h-20 md:hidden" />
    </>
  );
}
