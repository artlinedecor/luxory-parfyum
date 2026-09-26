"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ProductGrid from "@/components/ProductGrid";
import { useI18n } from "@/lib/i18n-context";
import { useEffect, useState } from "react";
import { fetchCatalogProducts } from "@/lib/products-query";
import { Product } from "@/lib/types";
import { useShopSettings } from "@/lib/settings-context";

export default function CatalogView() {
  const { t } = useI18n();
  const { shopPhone, telegramAdminUsername, telegramChannel } = useShopSettings();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchCatalogProducts().then(setProducts);
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 pt-20 sm:pt-24 pb-24 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          {/* Sarlavha ixcham — oldin mahsulotlardan oldin yarim ekran bo'sh joy edi */}
          <div className="space-y-1.5">
            <h1 className="font-heading text-3xl sm:text-4xl text-foreground">
              {t("catalog")} <span className="sr-only">— Toshkentda Original va Super Klon Atirlar | Parfume Lux</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("collection_desc")}
            </p>
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
