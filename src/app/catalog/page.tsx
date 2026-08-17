"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ProductGrid from "@/components/ProductGrid";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { siteConfig } from "@/config/site";
import { useI18n } from "@/lib/i18n-context";
import { useEffect, useState } from "react";
import { fetchCatalogProducts } from "@/lib/products-query";
import { Product } from "@/lib/types";
import { useShopSettings } from "@/lib/settings-context";

export default function CatalogPage() {
  const { t } = useI18n();
  const { shopPhone, telegramAdminUsername, telegramChannel } = useShopSettings();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchCatalogProducts().then(setProducts);
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 pt-24 pb-24 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Page header */}
          <div className="text-center mb-12 space-y-5">
            <p className="eyebrow text-muted-foreground">{siteConfig.siteName}</p>
            <h1 className="font-heading text-4xl sm:text-5xl text-foreground">
              {t("catalog")}
            </h1>
            <p className="max-w-xl mx-auto text-sm text-muted-foreground leading-relaxed">
              {t("collection_desc")}
            </p>
            <div className="gold-hairline w-24 mx-auto" />
          </div>

          {/* Products Grid */}
          <ProductGrid products={products} />
        </div>
      </main>
      <BottomNav />
      <div className="h-20 md:hidden" />
    </>
  );
}
