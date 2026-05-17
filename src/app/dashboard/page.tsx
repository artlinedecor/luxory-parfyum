"use client";

import { useState, useEffect } from "react";
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
  
  // Dynamic stats
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [recentOrdersList, setRecentOrdersList] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);

    const loadDashboardData = async () => {
      try {
        const supabase = createClient();

        // 1. Fetch products
        const { data: productsData } = await supabase.from("products").select("*");
        const products = (productsData || []) as Product[];
        setTotalProductsCount(products.length);

        // Build product cost price map
        const costPriceMap: Record<string, number> = {};
        products.forEach(p => {
          const rawCost = (p as any).cost_price_usd;
          costPriceMap[p.id] = rawCost !== undefined && rawCost !== null ? Number(rawCost) : 0;
        });

        // 2. Fetch orders
        const { data: ordersData } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });
        
        const orders = (ordersData || []) as Order[];
        setTotalOrdersCount(orders.length);
        
        const pending = orders.filter(o => o.status === "pending" || o.status === "accepted");
        setPendingOrdersCount(pending.length);

        // Map recent orders list (up to 5 items)
        const recent = orders.slice(0, 5).map(o => {
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
        setRecentOrdersList(recent);

        // 3. Fetch transactions
        const { data: txData } = await supabase.from("transactions").select("*");
        const transactions = (txData || []) as Transaction[];

        let incomeSum = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
        let expenseSum = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);

        // 4. Calculate Net Profit using dynamic Cost of Goods Sold (COGS)
        let cogs = 0;
        orders.forEach(o => {
          if (o.status === "delivered" && o.items && Array.isArray(o.items)) {
            o.items.forEach(item => {
              const cost = costPriceMap[item.product_id] || 0;
              cogs += cost * item.quantity;
            });
          }
        });

        setTotalIncome(incomeSum);
        setTotalExpense(expenseSum + cogs);
        setNetProfit(incomeSum - (expenseSum + cogs));

      } catch (error) {
        console.error("Error loading dashboard metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Title */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">
          <span className="text-gradient-gold">Analitika</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Biznesingizning umumiy ko&apos;rsatkichlari (Real vaqt rejimida)
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-6 h-32 animate-pulse bg-secondary/20" />
          <div className="glass-card rounded-2xl p-6 h-32 animate-pulse bg-secondary/20" />
          <div className="glass-card rounded-2xl p-6 h-32 animate-pulse bg-secondary/20" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Kirim */}
            <div className="glass-card rounded-2xl p-6 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Umumiy Kirim</span>
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-green-400">${totalIncome.toLocaleString()}</p>
            </div>

            {/* Chiqim */}
            <div className="glass-card rounded-2xl p-6 space-y-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Umumiy Chiqim (Tan narx + Xarajat)</span>
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-red-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-red-400">${totalExpense.toLocaleString()}</p>
            </div>

            {/* Foyda */}
            <div className="glass-card rounded-2xl p-6 space-y-3 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Sof Foyda</span>
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gold">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gradient-gold">${netProfit.toLocaleString()}</p>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{totalOrdersCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Buyurtmalar</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{pendingOrdersCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Kutilmoqda</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{totalProductsCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Mahsulotlar</p>
            </div>
          </div>

          {/* Recent Orders Table */}
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
                  {recentOrdersList.map((order) => {
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
                  {recentOrdersList.length === 0 && (
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
