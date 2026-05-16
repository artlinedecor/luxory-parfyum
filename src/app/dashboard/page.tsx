"use client";

import { useState, useEffect } from "react";

// Demo data — kelajakda Supabase'dan olinadi
const demoStats = {
  totalIncome: 4250,
  totalExpense: 1820,
  netProfit: 2430,
  totalOrders: 47,
  pendingOrders: 5,
  totalProducts: 10,
};

const recentOrders = [
  { id: "1", client: "Aziz Karimov", product: "Baccarat Rouge 540", amount: 35, status: "delivered", date: "2026-05-15" },
  { id: "2", client: "Malika Saidova", product: "Tom Ford Lost Cherry", amount: 40, status: "accepted", date: "2026-05-15" },
  { id: "3", client: "Bobur Toshmatov", product: "Creed Aventus (Original)", amount: 50, status: "pending", date: "2026-05-16" },
  { id: "4", client: "Nilufar Ahmedova", product: "Dior Sauvage", amount: 30, status: "delivered", date: "2026-05-14" },
  { id: "5", client: "Sardor Raxmatullayev", product: "YSL Libre", amount: 28, status: "cancelled", date: "2026-05-13" },
];

const statusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: "Kutilmoqda", color: "text-yellow-400 bg-yellow-400/10" },
  accepted: { text: "Qabul qilindi", color: "text-blue-400 bg-blue-400/10" },
  delivered: { text: "Yetkazildi", color: "text-green-400 bg-green-400/10" },
  cancelled: { text: "Bekor qilindi", color: "text-red-400 bg-red-400/10" },
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Title */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">
          <span className="text-gradient-gold">Analitika</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Biznesingizning umumiy ko&apos;rsatkichlari
        </p>
      </div>

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
          <p className="text-3xl font-bold text-green-400">${demoStats.totalIncome.toLocaleString()}</p>
        </div>

        {/* Chiqim */}
        <div className="glass-card rounded-2xl p-6 space-y-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Umumiy Chiqim</span>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-red-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-red-400">${demoStats.totalExpense.toLocaleString()}</p>
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
          <p className="text-3xl font-bold text-gradient-gold">${demoStats.netProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{demoStats.totalOrders}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Buyurtmalar</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{demoStats.pendingOrders}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Kutilmoqda</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{demoStats.totalProducts}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Mahsulotlar</p>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">So&apos;nggi buyurtmalar</h3>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Mijoz</th>
                <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Mahsulot</th>
                <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Summa</th>
                <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Status</th>
                <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Sana</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const status = statusLabels[order.status];
                return (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-3 text-sm text-foreground whitespace-nowrap">{order.client}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground whitespace-nowrap">{order.product}</td>
                    <td className="px-6 py-3 text-sm text-gold font-semibold whitespace-nowrap">${order.amount}</td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${status.color}`}>{status.text}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground whitespace-nowrap">{order.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
