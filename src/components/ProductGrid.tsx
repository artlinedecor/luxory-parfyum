"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const [activeTab, setActiveTab] = useState<"all" | "lux" | "original">("all");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female" | "unisex">("all");
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addItem } = useCart();
  const { t, lang } = useI18n();

  const filteredProducts = products.filter((p) => {
    const typeMatch =
      activeTab === "all" ||
      p.product_type === (activeTab === "lux" ? "lux_copy" : "original");
    const genderMatch =
      genderFilter === "all" || (p.gender || "unisex") === genderFilter;
    return typeMatch && genderMatch;
  });

  const handleAddToCart = (product: Product) => {
    addItem(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const handleOrder = (product: Product) => {
    addItem(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const genderLabels: Record<string, { uz: string; ru: string }> = {
    all: { uz: "Barchasi", ru: "Все" },
    male: { uz: "Erkaklar", ru: "Мужские" },
    female: { uz: "Ayollar", ru: "Женские" },
    unisex: { uz: "Unisex", ru: "Унисекс" },
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Type Tabs */}
      <div
        id="product-tabs"
        className="flex gap-1 p-1 rounded-2xl bg-secondary/50 backdrop-blur-sm w-fit mx-auto"
      >
        <button
          onClick={() => setActiveTab("all")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
            activeTab === "all"
              ? "bg-gradient-gold text-black shadow-lg shadow-gold/20 scale-105"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("tab_all")}
        </button>
        <button
          onClick={() => setActiveTab("lux")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
            activeTab === "lux"
              ? "bg-gradient-gold text-black shadow-lg shadow-gold/20 scale-105"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("tab_lux")}
        </button>
        <button
          onClick={() => setActiveTab("original")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
            activeTab === "original"
              ? "bg-gradient-gold text-black shadow-lg shadow-gold/20 scale-105"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("tab_original")}
        </button>
      </div>

      {/* Gender Filter */}
      <div className="flex gap-2 justify-center flex-wrap">
        {(["all", "male", "female", "unisex"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGenderFilter(g)}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 border ${
              genderFilter === g
                ? "border-gold bg-gold/15 text-gold shadow-md shadow-gold/10"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {g === "male" && "👨 "}
            {g === "female" && "👩 "}
            {g === "unisex" && "⚡ "}
            {lang === "ru" ? genderLabels[g].ru : genderLabels[g].uz}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
        {filteredProducts.map((product, index) => (
          <div
            key={product.id}
            className="animate-fade-in relative flex"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <ProductCard
              product={product}
              onAddToCart={handleAddToCart}
              onOrder={handleOrder}
            />
            {/* "Qo'shildi" notification */}
            {addedId === product.id && (
              <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-gold text-black text-[10px] font-bold uppercase tracking-wider animate-scale-in shadow-lg">
                {t("btn_added")}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredProducts.length === 0 && (
        <div className="py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4 animate-float">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-muted-foreground">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {t("empty_catalog")}
          </p>
        </div>
      )}
    </div>
  );
}
