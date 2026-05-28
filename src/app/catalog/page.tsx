"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ProductGrid from "@/components/ProductGrid";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { siteConfig } from "@/config/site";
import { useI18n } from "@/lib/i18n-context";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Product } from "@/lib/types";
import { useShopSettings } from "@/lib/settings-context";

export default function CatalogPage() {
  const { t } = useI18n();
  const { shopPhone, telegramAdminUsername, telegramChannel } = useShopSettings();
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
        console.error("Error fetching database products in catalog:", e);
      }
    };
    fetchProducts();
  }, []);

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

            {/* Social Links / Contacts */}
            <div className="flex justify-center items-center gap-4 pt-2">
              <a href="https://www.instagram.com/elore_parfumes?igsh=a2xrMmp1ZmpleGpm" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10 transition-all shadow-lg hover:scale-110" title="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href={`tel:${shopPhone.replace(/\s/g, '')}`} className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-all shadow-lg hover:scale-110" title="Telefon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </a>
              <a href={telegramAdminUsername} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-[#0088cc] hover:bg-[#0088cc]/10 transition-all shadow-lg hover:scale-110" title="Telegram Lichka">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-18 8a2.25 2.25 0 0 0 .122 4.108l4.49 1.49 2.112 6.538a1.5 1.5 0 0 0 2.813.111l2.584-4.838 5.766 4.316a2.25 2.25 0 0 0 3.593-1.63L23.454 3.73a2.25 2.25 0 0 0-2.256-1.297zM8.835 15.6l-1.39-4.254 11.233-7.534-8.835 11.161v.627zm-3.056-2.582l-2.92-.973L19.467 4.6l-13.688 8.418zm13.18 7.078l-5.328-3.988L16.4 12.22l-1.898-2.4 4.457 6.276z"/></svg>
              </a>
              <a href={telegramChannel} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-[#0088cc] hover:bg-[#0088cc]/10 transition-all shadow-lg hover:scale-110" title="Telegram Kanal">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </a>
            </div>

            <div className="flex justify-center items-center gap-2 mt-4">
              <div className="w-12 h-px bg-gradient-to-r from-gold/50 to-transparent" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            </div>
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
