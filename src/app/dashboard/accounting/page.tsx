"use client";

import { useState, useEffect, useMemo } from "react";
import { Product } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

export default function AccountingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("title", { ascending: true });

        if (error) throw error;
        setProducts(data || []);
      } catch (e) {
        console.error("Error fetching database products in accounting:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const totals = useMemo(() => {
    let totalStock = 0;
    let expectedRevenue = 0;
    
    products.forEach((p) => {
      const stock = p.stock || 0;
      totalStock += stock;
      expectedRevenue += stock * (p.price_usd || 0);
    });

    return { totalStock, expectedRevenue };
  }, [products]);

  return (
    <div className="space-y-6 max-w-6xl pb-10">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">
          <span className="text-gradient-gold">Hisob-kitob</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ombordagi jami tovarlar qoldig&apos;i va kutilayotgan daromad
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6 border-l-4 border-l-blue-500">
          <h3 className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-2">Jami Tovar Qoldig&apos;i</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{loading ? "..." : totals.totalStock.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">ta</span>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 border-l-4 border-l-green-500">
          <h3 className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-2">Sotilganda bo&apos;ladigan summa</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gradient-gold">${loading ? "..." : totals.expectedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-sm text-muted-foreground">kutilayotgan daromad</span>
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="glass-card rounded-2xl overflow-hidden mt-8">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">№</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Nomi</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right">Narxi ($)</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right">Qoldiq (ta)</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right">Summasi ($)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm animate-pulse">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">
                    Omborda tovar yo&apos;q
                  </td>
                </tr>
              ) : (
                products.map((product, index) => {
                  const stock = product.stock || 0;
                  const price = product.price_usd || 0;
                  const total = stock * price;
                  return (
                    <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-3 text-sm text-muted-foreground">{index + 1}</td>
                      <td className="px-6 py-3 text-sm font-medium text-foreground max-w-[250px] truncate" title={product.title}>
                        {product.title}
                      </td>
                      <td className="px-6 py-3 text-sm text-foreground text-right">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3 text-sm text-foreground text-right">
                        <span className={`font-semibold px-2.5 py-1 rounded-full text-xs ${stock > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                          {stock}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-gradient-gold text-right">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
