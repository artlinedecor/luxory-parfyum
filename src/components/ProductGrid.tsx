"use client";

import { useState, useMemo } from "react";
import { Product } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const [genderFilter, setGenderFilter] = useState<
    "all" | "male" | "female" | "unisex"
  >("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addItem } = useCart();
  const { t, lang } = useI18n();

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => {
        const productGender = p.gender || "unisex";
        const genderMatch =
          genderFilter === "all" ||
          productGender === genderFilter ||
          (genderFilter !== "unisex" && productGender === "unisex");
        const stockMatch = !inStockOnly || (Number(p.stock) || 0) > 0;
        const searchMatch =
          !q ||
          (p.title || "").toLowerCase().includes(q) ||
          (p.title_ru || "").toLowerCase().includes(q);
        return genderMatch && stockMatch && searchMatch;
      })
      // Omborda bor mahsulotlar oldinda (tez sotilar uchun)
      .sort((a, b) => {
        const sa = (Number(a.stock) || 0) > 0 ? 1 : 0;
        const sb = (Number(b.stock) || 0) > 0 ? 1 : 0;
        return sb - sa;
      });
  }, [products, genderFilter, inStockOnly, query]);

  const handleAddToCart = (product: Product) => {
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
      {/* Search bar */}
      <div className="max-w-xl mx-auto w-full">
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-gold transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            className="w-full pl-12 pr-11 py-3.5 rounded-2xl bg-secondary/60 backdrop-blur-sm border border-border
                       text-sm text-foreground placeholder:text-muted-foreground
                       focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20
                       transition-all duration-300 shadow-inner"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="clear"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filters row */}
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

        {/* In-stock toggle */}
        <button
          onClick={() => setInStockOnly((v) => !v)}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 border inline-flex items-center gap-1.5 ${
            inStockOnly
              ? "border-green-500 bg-green-500/15 text-green-400 shadow-md shadow-green-500/10"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              inStockOnly ? "bg-green-400 animate-pulse" : "bg-muted-foreground"
            }`}
          />
          {t("filter_in_stock")}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
        {filteredProducts.map((product) => (
          <div key={product.id} className="animate-fade-in relative flex">
            <ProductCard product={product} onAddToCart={handleAddToCart} />
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
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-8 h-8 text-muted-foreground"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {query ? (
              <>
                &ldquo;<span className="text-gold">{query}</span>&rdquo;{" "}
                {t("search_no_results")}
              </>
            ) : (
              t("empty_catalog")
            )}
          </p>
        </div>
      )}
    </div>
  );
}
