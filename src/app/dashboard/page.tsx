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

    // ── SOTUVLAR (faqat yetkazilgan buyurtmalar) ──
    let totalSoldRevenue = 0;
    let totalSoldCOGS = 0;
    let totalSoldItems = 0;
    let totalPendingItems = 0;

    deliveredOrders.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          totalSoldRevenue += item.price_at_purchase * item.quantity;
          totalSoldCOGS += (costPriceMap[item.product_id] || 0) * item.quantity;
          totalSoldItems += item.quantity;
        });
      }
    });

    orders.filter(o => o.status === "pending" || o.status === "accepted").forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          totalPendingItems += item.quantity;
        });
      }
    });

    // ── RASXODLAR (kassadan chiqimlar: target, yetkazish, arenda...) ──
    const totalExpenses = transactions
      .filter(t => t.type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);

    // Ajratib olamiz: tovar xaridi/cargo (capital) va operatsion xarajatlar (operating)
    const capitalExpenses = transactions
      .filter(t => t.type === "expense" && t.description && /tavar|tovar|mahsulot|xarid|oldik|yulkira|cargo|kargo|turkiya|prixod/i.test(t.description))
      .reduce((s, t) => s + Number(t.amount), 0);

    const operatingExpenses = totalExpenses - capitalExpenses;

    // SOF FOYDA = Savdo - Sotilgan tovarlarning tan narxi (COGS) - Operatsion Rasxodlar (target, chatgpt va h.k.)
    // Bu yerda wholesale tovar xaridlari (Tavar oldik) ayirilmaydi, chunki ular allaqachon Tan Narx (COGS) sifatida ayirilmoqda!
    const netProfit = totalSoldRevenue - totalSoldCOGS - operatingExpenses;

    // ── KASSA ─────────────────────────────────
    const kassaIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const kassaExpense = totalExpenses;
    const kassaBalance = kassaIncome - kassaExpense;

    // Savdoning qoldiq puli = Barcha Kirim - Barcha Chiqim
    const savdoQoldiq = kassaIncome - totalExpenses;

    const recentOrders = orders.map(o => {
      const items = o.items || [];
      const totalAmount = items.reduce((sum, item) => sum + (item.price_at_purchase * item.quantity), 0);

      return {
        id: o.id,
        client: o.client_name,
        items: items.map(item => ({
          title: item.title || "Parfyum",
          quantity: item.quantity,
          price: item.price_at_purchase
        })),
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
      totalSoldItems,
      totalPendingItems,
      productsCount: products.length,
      totalSoldRevenue,
      totalSoldCOGS,
      totalExpenses,
      operatingExpenses,
      capitalExpenses,
      savdoQoldiq,
      netProfit,
      kassaIncome,
      kassaExpense,
      kassaBalance,
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
          Biznesingizning umumiy ko&apos;rsatkichlari — ombor, sotuvlar va moliya
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
          {/* ROW 1: ASOSIY KO'RSATKICHLAR                          */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Jami Savdo */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-blue-400">${fmt(stats.totalSoldRevenue)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Jami Savdo</p>
              <p className="text-[10px] text-muted-foreground">yetkazilganlardan</p>
            </div>

            {/* Jami Rasxod */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-red-400">${fmt(stats.totalExpenses)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Jami Rasxod</p>
              <p className="text-[10px] text-muted-foreground">kassadan chiqimlar</p>
            </div>

            {/* Savdo Qoldig'i */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1">
              <p className={`text-2xl font-bold ${stats.savdoQoldiq >= 0 ? 'text-blue-400' : 'text-red-400'}`}>${fmt(stats.savdoQoldiq)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Savdo Qoldig&apos;i</p>
              <p className="text-[10px] text-muted-foreground">barcha kirim − chiqim</p>
            </div>

            {/* Sof Foyda */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1 border border-gold/20">
              <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${fmt(stats.netProfit)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Sof Foyda</p>
              <p className="text-[10px] text-muted-foreground">tan narx + oper. rasxod ayirilgan</p>
            </div>

            {/* Ombordagi Mol */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-foreground">{stats.totalStock}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Qoldiq (ta)</p>
              <p className="text-[10px] text-red-400 font-medium">${fmt(stats.totalCostInvested)} tikilgan</p>
            </div>

            {/* Sotilgan atirlar */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1 border border-gold/20">
              <p className="text-2xl font-bold text-gradient-gold">{stats.totalSoldItems} ta</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Sotilgan Atirlar</p>
              <p className="text-[10px] text-muted-foreground">{stats.totalOrdersCount} ta buyurtma ({stats.totalPendingItems} ta kutilmoqda)</p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ROW 2: SOF FOYDA TARKIBI (Breakdown)                  */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Foyda Tarkibi */}
            <div className="glass-card rounded-2xl p-6 space-y-4 bg-secondary/5 border border-secondary">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">💰 Sof Foyda Tarkibi</h3>
                <span className={`text-xl font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${fmt(stats.netProfit)}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Jami Savdo (Tushum)</span>
                  <span className="text-blue-400 font-semibold">+${fmt(stats.totalSoldRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sotilganlar Tan Narxi (COGS)</span>
                  <span className="text-orange-400 font-semibold">-${fmt(stats.totalSoldCOGS)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Operatsion Rasxodlar (Target, ChatGPT...)</span>
                  <span className="text-red-400 font-semibold">-${fmt(stats.operatingExpenses)}</span>
                </div>
                <div className="border-t border-border/50 pt-2 flex items-center justify-between text-sm font-bold">
                  <span className="text-foreground">= Sof Foyda</span>
                  <span className={stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>${fmt(stats.netProfit)}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
                * Sof Foyda = Savdo summasi − Sotilgan tovarlarning tan narxi − Operatsion chiqimlar (Kassadagi ulgurji tovar xaridlaridan tashqari boshqa rasxodlar). Bu tovar xarajatlarini ikki marta hisoblanishini oldini oladi.
              </p>
            </div>

            {/* Kassa Holati */}
            <div className="glass-card rounded-2xl p-6 space-y-4 bg-secondary/5 border border-secondary">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">🏦 Kassa & Savdo Qoldig&apos;i</h3>
                <span className={`text-xl font-bold ${stats.kassaBalance >= 0 ? 'text-gradient-gold' : 'text-red-400'}`}>${fmt(stats.kassaBalance)}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Jami Kirim (Savdo + Sarmoya)</span>
                  <span className="text-green-400 font-semibold">+${fmt(stats.kassaIncome)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Jami Chiqim (Barcha Rasxodlar)</span>
                  <span className="text-red-400 font-semibold">-${fmt(stats.totalExpenses)}</span>
                </div>
                <div className="border-t border-border/50 pt-2 flex items-center justify-between text-sm font-bold">
                  <span className="text-foreground">= Kassa Qoldig&apos;i (Pul qoldig&apos;i)</span>
                  <span className={stats.kassaBalance >= 0 ? 'text-green-400' : 'text-red-400'}>${fmt(stats.kassaBalance)}</span>
                </div>
                <div className="border-t border-border/20 pt-2 flex items-center justify-between text-sm font-bold text-muted-foreground">
                  <span>Savdo Qoldiq Puli (Kirim - Chiqim)</span>
                  <span className={stats.savdoQoldiq >= 0 ? 'text-blue-400' : 'text-red-400'}>${fmt(stats.savdoQoldiq)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ROW 3: MOLIYAVIY OQIM GRAFIK (Visual Bar)             */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Sotuvlar Oqimi</h3>
            <div className="space-y-3">

              {/* Jami Savdo */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Jami Savdo (Tushum)</span>
                  <span className="text-blue-400 font-semibold">${fmt(stats.totalSoldRevenue)}</span>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.totalSoldRevenue > 0 ? Math.min(100, (stats.totalSoldRevenue / Math.max(stats.totalSoldRevenue, 1)) * 100) : 0}%` }}
                  />
                </div>
              </div>

              {/* Tan Narx */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tan Narx (Tovar xaridi)</span>
                  <span className="text-orange-400 font-semibold">${fmt(stats.totalSoldCOGS)}</span>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.totalSoldCOGS > 0 ? Math.min(100, (stats.totalSoldCOGS / Math.max(stats.totalSoldRevenue, 1)) * 100) : 0}%` }}
                  />
                </div>
              </div>

              {/* Operatsion Rasxodlar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Operatsion Rasxodlar (Target, ChatGPT...)</span>
                  <span className="text-red-400 font-semibold">${fmt(stats.operatingExpenses)}</span>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.operatingExpenses > 0 ? Math.min(100, (stats.operatingExpenses / Math.max(stats.totalSoldRevenue, 1)) * 100) : 0}%` }}
                  />
                </div>
              </div>

              {/* Sof Foyda */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">Sof Foyda</span>
                  <span className={`font-semibold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${fmt(stats.netProfit)}</span>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${stats.netProfit >= 0 ? 'bg-gradient-to-r from-green-600 to-emerald-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
                    style={{ width: `${Math.abs(stats.netProfit) > 0 ? Math.min(100, (Math.abs(stats.netProfit) / Math.max(stats.totalSoldRevenue, 1)) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ROW 4: KUTILAYOTGAN FOYDA (Agar hammasi sotilsa)      */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="glass-card rounded-2xl p-6 space-y-3 bg-secondary/5 border border-secondary">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">📊 Kutilayotgan Ko&apos;rsatkichlar (Agar ombordagi barcha mol sotilsa)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-gold">${fmt(stats.expectedRevenue)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Kutilayotgan Daromad</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-orange-400">${fmt(stats.totalCostInvested)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Ombor Tan Narxi</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${stats.expectedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${fmt(stats.expectedProfit)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Kutilayotgan Foyda</p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ROW 4.5: TOVARLAR JADVALI (Batafsil Hisob-kitob)         */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-gold"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125m0-2.625c0-.621.504-1.125 1.125-1.125" /></svg>
              Tovarlar hisob-kitobi (Batafsil)
            </h3>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      <th className="px-4 py-3.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">№</th>
                      <th className="px-4 py-3.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Nomi</th>
                      <th className="px-4 py-3.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right font-semibold">Sotish narxi</th>
                      <th className="px-4 py-3.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right font-semibold">Qoldiq</th>
                      <th className="px-4 py-3.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right font-semibold">Tikilgan pul</th>
                      <th className="px-4 py-3.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right font-semibold">Sotilgandagi</th>
                      <th className="px-4 py-3.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right font-semibold">Kutilayotgan foyda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground text-sm">
                          Omborda tovarlar topilmadi
                        </td>
                      </tr>
                    ) : (
                      <>
                        {products.map((product, index) => {
                          const stock = product.stock || 0;
                          const price = product.price_usd || 0;
                          const costPrice = (product as any).cost_price_usd || 0;
                          const invested = stock * costPrice;
                          const revenue = stock * price;
                          const profit = revenue - invested;
                          return (
                            <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                              <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                              <td className="px-4 py-3 text-sm font-medium text-foreground max-w-[200px] truncate" title={product.title}>
                                {product.title}
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground text-right font-medium">${fmt(price)}</td>
                              <td className="px-4 py-3 text-sm text-right">
                                <span className={`font-semibold px-2.5 py-1 rounded-full text-xs ${stock > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                                  {stock} ta
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm text-red-400 font-semibold">${fmt(invested)}</span>
                                <span className="block text-[10px] text-muted-foreground">({fmt(costPrice)} × {stock})</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-green-400 text-right font-semibold">${fmt(revenue)}</td>
                              <td className={`px-4 py-3 text-sm font-bold text-right ${profit >= 0 ? 'text-gradient-gold' : 'text-red-400'}`}>
                                ${fmt(profit)}
                              </td>
                            </tr>
                          );
                        })}
                        {/* JAMI ROW */}
                        <tr className="bg-secondary/40 border-t-2 border-gold/30">
                          <td className="px-4 py-4 text-sm font-bold text-foreground" colSpan={2}>JAMI</td>
                          <td className="px-4 py-4 text-sm text-foreground text-right font-bold">—</td>
                          <td className="px-4 py-4 text-sm text-blue-400 text-right font-bold">{stats.totalStock} ta</td>
                          <td className="px-4 py-4 text-sm text-red-400 text-right font-bold">${fmt(stats.totalCostInvested)}</td>
                          <td className="px-4 py-4 text-sm text-green-400 text-right font-bold">${fmt(stats.expectedRevenue)}</td>
                          <td className="px-4 py-4 text-sm font-bold text-right text-gradient-gold">${fmt(stats.expectedProfit)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ROW 5: SO'NGGI BUYURTMALAR                            */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-secondary/10">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Buyurtmalar ro&apos;yxati ({stats.recentOrders.length} ta)</h3>
            </div>

            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-border/50">
              {stats.recentOrders.map((order) => {
                const status = statusLabels[order.status] || statusLabels.pending;
                return (
                  <div key={order.id} className="p-4 space-y-2 bg-[#0d0d0d]/40">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{order.client}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{order.date}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>{status.text}</span>
                    </div>
                    <div className="space-y-1 bg-secondary/40 p-2.5 rounded-xl border border-border/50">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-muted-foreground truncate max-w-[200px]">{item.title}</span>
                          <span className="text-foreground font-semibold">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-1 text-xs">
                      <span className="text-muted-foreground font-medium">Jami summa:</span>
                      <span className="text-gold font-bold">${order.amount}</span>
                    </div>
                  </div>
                );
              })}
              {stats.recentOrders.length === 0 && (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm uppercase tracking-wider">
                  So&apos;nggi buyurtmalar topilmadi
                </div>
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto scrollbar-hide">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/20">
                    <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Mijoz</th>
                    <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Mahsulotlar</th>
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
                        <td className="px-6 py-3 text-sm text-muted-foreground">
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] font-semibold text-foreground">x{item.quantity}</span>
                                <span className="text-xs truncate max-w-[200px]" title={item.title}>{item.title}</span>
                              </div>
                            ))}
                          </div>
                        </td>
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
