"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Order, Product, Transaction } from "@/lib/types";

const statusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: "Kutilmoqda", color: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20" },
  accepted: { text: "Qabul qilindi", color: "text-blue-400 bg-blue-400/10 border border-blue-400/20" },
  delivered: { text: "Yetkazildi", color: "text-green-400 bg-green-400/10 border border-green-400/20" },
  cancelled: { text: "Bekor qilindi", color: "text-red-400 bg-red-400/10 border border-red-400/20" },
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setMounted(true);

    const loadDashboardData = async () => {
      try {
        const supabase = createClient();

        const [prodRes, ordRes, txRes] = await Promise.all([
          supabase.from("products").select("*"),
          supabase.from("orders").select("*").order("created_at", { ascending: false }),
          supabase.from("transactions").select("*"),
        ]);

        setProducts(prodRes.data || []);
        setOrders((ordRes.data || []) as Order[]);
        setTransactions((txRes.data || []) as Transaction[]);
      } catch (error) {
        console.error("Error loading dashboard metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const stats = useMemo(() => {
    // ── OMBOR ──────────────────────────────────
    let totalStock = 0;
    let totalCostInvested = 0;
    let expectedRevenue = 0;

    const costPriceMap: Record<string, number> = {};
    products.forEach(p => {
      const cost = (p as any).cost_price_usd || 0;
      costPriceMap[p.id] = cost;
      const stock = p.stock || 0;
      totalStock += stock;
      totalCostInvested += stock * cost;
      expectedRevenue += stock * (p.price_usd || 0);
    });

    const expectedProfit = expectedRevenue - totalCostInvested;

    // ── BUYURTMALAR ───────────────────────────
    const totalOrdersCount = orders.length;
    const pendingOrdersCount = orders.filter(o => o.status === "pending" || o.status === "accepted").length;
    const deliveredOrders = orders.filter(o => o.status === "delivered");

    // ── SOTUVLAR ──────────────────────────────
    let totalSoldRevenue = 0;
    let totalSoldCOGS = 0;

    deliveredOrders.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          totalSoldRevenue += item.price_at_purchase * item.quantity;
          totalSoldCOGS += (costPriceMap[item.product_id] || 0) * item.quantity;
        });
      }
    });

    const realizedProfit = totalSoldRevenue - totalSoldCOGS;

    // ── KASSA ─────────────────────────────────
    const kassaIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const kassaExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const kassaBalance = kassaIncome - kassaExpense;

    // ── UMUMIY ────────────────────────────────
    const totalAssets = totalCostInvested + kassaBalance;

    // ── SO'NGGI BUYURTMALAR ───────────────────
    const recentOrders = orders.slice(0, 5).map(o => {
      const firstProduct = o.items && o.items[0] ? o.items[0].title : "Parfyum";
      const itemsCount = o.items ? o.items.length : 0;
      const productText = itemsCount > 1 ? `${firstProduct} +${itemsCount - 1} ta` : firstProduct;
      const totalAmount = o.items ? o.items.reduce((sum, item) => sum + (item.price_at_purchase * item.quantity), 0) : 0;

      return {
        id: o.id,
        client: o.client_name,
        product: productText,
        amount: totalAmount,
        status: o.status,
        date: new Date(o.created_at).toLocaleDateString("uz-UZ", { month: "short", day: "numeric" }),
      };
    });

    return {
      totalStock,
      totalCostInvested,
      expectedRevenue,
      expectedProfit,
      totalOrdersCount,
      pendingOrdersCount,
      productsCount: products.length,
      totalSoldRevenue,
      totalSoldCOGS,
      realizedProfit,
      kassaIncome,
      kassaExpense,
      kassaBalance,
      totalAssets,
      recentOrders,
    };
  }, [products, orders, transactions]);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Title */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">
          <span className="text-gradient-gold">Analitika</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Biznesingizning umumiy ko&apos;rsatkichlari — ombor va sotuvlar
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 h-32 animate-pulse bg-secondary/20" />
          ))}
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════ */}
          {/* ROW 1: OMBOR + SOTUVLAR + UMUMIY                      */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Ombordagi Mol */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-foreground">{stats.totalStock}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Qoldiq (ta)</p>
              <p className="text-[10px] text-red-400 font-medium">${fmt(stats.totalCostInvested)} tikilgan</p>
            </div>

            {/* Mahsulotlar */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-foreground">{stats.productsCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mahsulotlar</p>
            </div>

            {/* Buyurtmalar */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-foreground">{stats.totalOrdersCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Buyurtmalar</p>
              <p className="text-[10px] text-yellow-400 font-medium">{stats.pendingOrdersCount} kutilmoqda</p>
            </div>

            {/* Sof Foyda (sotilganlardan) */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1">
              <p className={`text-2xl font-bold ${stats.realizedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${fmt(stats.realizedProfit)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sof Foyda</p>
              <p className="text-[10px] text-muted-foreground">sotilganlardan</p>
            </div>

            {/* Umumiy Tovar Qiymati */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1 bg-gold/5 border border-gold/20 col-span-2 sm:col-span-1">
              <p className="text-2xl font-bold text-gradient-gold">${fmt(stats.totalCostInvested)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Jami Tikilgan Pul</p>
              <p className="text-[10px] text-muted-foreground">Faqat tovar qiymati</p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ROW 2: MOLIYAVIY OQIM GRAFIK (Visual Bar)             */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Sotuvlar Oqimi</h3>
            <div className="space-y-3">

              {/* Ombordagi Mol (Tikilgan Pul) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Ombordagi Mol (Tikilgan Pul)</span>
                  <span className="text-blue-400 font-semibold">${fmt(stats.totalCostInvested)}</span>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.totalCostInvested > 0 ? Math.min(100, (stats.totalCostInvested / Math.max(stats.expectedRevenue, stats.totalCostInvested, 1)) * 100) : 0}%` }}
                  />
                </div>
              </div>

              {/* Kutilayotgan Daromad */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Kutilayotgan Daromad (Agar hammasi sotilsa)</span>
                  <span className="text-gold font-semibold">${fmt(stats.expectedRevenue)}</span>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.expectedRevenue > 0 ? Math.min(100, (stats.expectedRevenue / Math.max(stats.expectedRevenue, stats.totalCostInvested, 1)) * 100) : 0}%` }}
                  />
                </div>
              </div>

              {/* Sof Foyda */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Sof Foyda (Sotilganlardan)</span>
                  <span className={`font-semibold ${stats.realizedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${fmt(stats.realizedProfit)}</span>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${stats.realizedProfit >= 0 ? 'bg-gradient-to-r from-green-600 to-emerald-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
                    style={{ width: `${Math.abs(stats.realizedProfit) > 0 ? Math.min(100, (Math.abs(stats.realizedProfit) / Math.max(stats.expectedRevenue, stats.totalCostInvested, 1)) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ROW 3: SO'NGGI BUYURTMALAR                            */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-secondary/10">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">So&apos;nggi buyurtmalar</h3>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/20">
                    <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Mijoz</th>
                    <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Mahsulot</th>
                    <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Summa</th>
                    <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Status</th>
                    <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => {
                    const status = statusLabels[order.status] || statusLabels.pending;
                    return (
                      <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-3 text-sm text-foreground font-semibold whitespace-nowrap">{order.client}</td>
                        <td className="px-6 py-3 text-sm text-muted-foreground whitespace-nowrap">{order.product}</td>
                        <td className="px-6 py-3 text-sm text-gold font-semibold whitespace-nowrap">${order.amount}</td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${status.color}`}>{status.text}</span>
                        </td>
                        <td className="px-6 py-3 text-sm text-muted-foreground whitespace-nowrap">{order.date}</td>
                      </tr>
                    );
                  })}
                  {stats.recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm uppercase tracking-wider">
                        So&apos;nggi buyurtmalar topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
