"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Transaction, Order, Product } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

export default function CashflowPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<"all" | "sales" | "expenses">("all");

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const [txRes, ordRes, prodRes] = await Promise.all([
        supabase.from("transactions").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*"),
      ]);

      setTransactions(txRes.data || []);
      setOrders((ordRes.data || []) as Order[]);
      setProducts(prodRes.data || []);
    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  // ── HISOB-KITOB ──────────────────────────────
  const accounting = useMemo(() => {
    const costPriceMap: Record<string, number> = {};
    products.forEach(p => {
      costPriceMap[p.id] = (p as any).cost_price_usd || 0;
    });

    // Savdodan tushgan jami summa (faqat yetkazilgan)
    const deliveredOrders = orders.filter(o => o.status === "delivered");
    let totalSalesRevenue = 0;
    let totalCOGS = 0;

    deliveredOrders.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          totalSalesRevenue += item.price_at_purchase * item.quantity;
          totalCOGS += (costPriceMap[item.product_id] || 0) * item.quantity;
        });
      }
    });

    // Kassadagi tranzaksiyalar
    const incomeTransactions = transactions.filter(t => t.type === "income");
    const expenseTransactions = transactions.filter(t => t.type === "expense");

    const totalIncome = incomeTransactions.reduce((s, t) => s + Number(t.amount), 0);
    const totalExpenses = expenseTransactions.reduce((s, t) => s + Number(t.amount), 0);
    const kassaBalance = totalIncome - totalExpenses;

    // Sof Foyda = Savdo - Tan narx - Rasxodlar
    const netProfit = totalSalesRevenue - totalCOGS - totalExpenses;

    return {
      totalSalesRevenue,
      totalCOGS,
      totalIncome,
      totalExpenses,
      kassaBalance,
      netProfit,
      incomeTransactions,
      expenseTransactions,
      deliveredOrdersCount: deliveredOrders.length,
    };
  }, [transactions, orders, products]);

  // Running balance for table
  const txWithBalance = useMemo(() => {
    const filtered = activeView === "sales"
      ? transactions.filter(t => t.type === "income")
      : activeView === "expenses"
        ? transactions.filter(t => t.type === "expense")
        : transactions;

    let runningBalance = 0;
    const reversed = [...filtered].reverse();
    const result = reversed.map(tx => {
      if (tx.type === "income") runningBalance += Number(tx.amount);
      else runningBalance -= Number(tx.amount);
      return { ...tx, balance: runningBalance };
    });
    return result.reverse();
  }, [transactions, activeView]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert([{ type, amount: Number(amount), description }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setTransactions([data[0], ...transactions]);
      } else {
        fetchData();
      }
      setIsModalOpen(false);
      setAmount("");
      setDescription("");
    } catch (err) {
      console.error("Error saving transaction:", err);
      alert("Tranzaksiyani saqlashda xatolik yuz berdi!");
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!window.confirm("Bu tranzaksiyani o'chirishni xohlaysizmi?")) return;
    setTransactions(prev => prev.filter(t => t.id !== txId));
    const supabase = createClient();
    await supabase.from("transactions").delete().eq("id", txId);
  };

  // ── CSV EXPORT (Google Sheets uchun) ──────────
  const exportToCSV = () => {
    const now = new Date();
    const monthName = now.toLocaleDateString("uz-UZ", { year: "numeric", month: "long" });

    // Header
    let csv = "\uFEFF"; // BOM for Excel UTF-8
    csv += `Lux Atir — Oylik Hisob-kitob (${monthName})\n\n`;

    // Summary
    csv += "XULOSA\n";
    csv += `Jami Savdo (Tushum),$${accounting.totalSalesRevenue}\n`;
    csv += `Tan Narx (COGS),$${accounting.totalCOGS}\n`;
    csv += `Jami Rasxodlar,$${accounting.totalExpenses}\n`;
    csv += `Sof Foyda,$${accounting.netProfit}\n`;
    csv += `Kassa Qoldigi,$${accounting.kassaBalance}\n\n`;

    // Savdo (Kirim) jadvali
    csv += "SAVDO (KIRIM)\n";
    csv += "Sana,Tavsif,Summa\n";
    accounting.incomeTransactions.forEach(tx => {
      const date = new Date(tx.created_at).toLocaleDateString("uz-UZ");
      csv += `${date},"${tx.description}",+$${tx.amount}\n`;
    });
    csv += `,,Jami: +$${accounting.totalIncome}\n\n`;

    // Rasxodlar (Chiqim) jadvali
    csv += "RASXODLAR (CHIQIM)\n";
    csv += "Sana,Tavsif,Summa\n";
    accounting.expenseTransactions.forEach(tx => {
      const date = new Date(tx.created_at).toLocaleDateString("uz-UZ");
      csv += `${date},"${tx.description}",-$${tx.amount}\n`;
    });
    csv += `,,Jami: -$${accounting.totalExpenses}\n`;

    // Download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lux-atir-hisobot-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            <span className="text-gradient-gold">Hisob-kitob</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Savdo, rasxodlar va kassa jurnali
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export CSV */}
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gold/30 text-gold font-bold text-xs uppercase tracking-wider hover:bg-gold/10 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            CSV Export
          </button>
          {/* Yangi Chiqim */}
          <button
            onClick={() => {
              setType("expense");
              setAmount("");
              setDescription("");
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-gold text-black font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Yangi tranzaksiya
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SUMMARY CARDS                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-blue-500/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Jami Savdo</p>
          <p className="text-2xl font-bold text-blue-400">${fmt(accounting.totalSalesRevenue)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{accounting.deliveredOrdersCount} ta buyurtma</p>
        </div>
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-red-500/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Jami Rasxod</p>
          <p className="text-2xl font-bold text-red-400">${fmt(accounting.totalExpenses)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{accounting.expenseTransactions.length} ta chiqim</p>
        </div>
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-green-500/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Sof Foyda</p>
          <p className={`text-2xl font-bold ${accounting.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${fmt(accounting.netProfit)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">savdo − tan narx − rasxod</p>
        </div>
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-gold/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Kassa Qoldig&apos;i</p>
          <p className={`text-2xl font-bold ${accounting.kassaBalance >= 0 ? 'text-gradient-gold' : 'text-red-400'}`}>${fmt(accounting.kassaBalance)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">kirim − chiqim</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FILTER TABS                                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="flex gap-1 p-1 rounded-2xl bg-secondary/50 backdrop-blur-sm w-fit">
        {(["all", "sales", "expenses"] as const).map(v => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              activeView === v
                ? "bg-gradient-gold text-black shadow-lg shadow-gold/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v === "all" ? "Barchasi" : v === "sales" ? "💰 Savdo" : "📉 Rasxodlar"}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TRANSACTIONS TABLE                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Turi</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Tavsif (Sabab)</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Summa</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Balans</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Sana</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right">Amal</th>
              </tr>
            </thead>
            <tbody>
              {txWithBalance.map((tx) => (
                <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase ${
                      tx.type === "income" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {tx.type === "income" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" /></svg>
                      )}
                      {tx.type === "income" ? "Savdo" : "Rasxod"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-foreground">{tx.description}</td>
                  <td className={`px-6 py-3 text-sm font-bold ${tx.type === "income" ? "text-green-400" : "text-red-400"}`}>
                    {tx.type === "income" ? "+" : "-"}${tx.amount}
                  </td>
                  <td className={`px-6 py-3 text-sm font-bold ${tx.balance >= 0 ? "text-gradient-gold" : "text-red-400"}`}>
                    ${tx.balance}
                  </td>
                  <td className="px-6 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {isMounted ? new Date(tx.created_at).toLocaleString("uz-UZ", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "..."}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                      title="O'chirish"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {txWithBalance.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground text-sm">
                    Tranzaksiyalar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL: Yangi tranzaksiya                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-2xl p-6 relative animate-scale-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-lg font-semibold text-foreground mb-5">
              Yangi Tranzaksiya
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex gap-2 p-1 bg-secondary rounded-xl">
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                    type === "income" ? "bg-green-500/20 text-green-400" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Kirim (Savdo)
                </button>
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                    type === "expense" ? "bg-red-500/20 text-red-400" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Chiqim (Rasxod)
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Summa ($)</label>
                <input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-lg font-bold text-foreground focus:outline-none focus:border-gold/50" />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Tavsif (Sabab)</label>
                <input required type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === "expense" ? "Masalan: Target reklama, Yetkazish" : "Masalan: Buyurtma #123 daromadi"} className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-gold/50" />
              </div>

              <button type="submit" className={`w-full py-3.5 mt-2 rounded-xl font-bold uppercase tracking-wider text-sm transition-all text-black shadow-lg ${
                type === "income" ? "bg-green-400 hover:bg-green-500 shadow-green-500/20" : "bg-red-400 hover:bg-red-500 shadow-red-500/20"
              }`}>
                Saqlash
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
