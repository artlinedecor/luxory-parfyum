"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Transaction, Order, Product } from "@/lib/types";
import { dashLoad, dashInsert, dashDelete } from "@/lib/dashboard-api";
import { usdToUzs, summarizeFinances, EXPENSE_SEGMENTS, EXPENSE_SEGMENT_LABELS, type ExpenseSegment } from "@/lib/accounting";

type TxType = "income" | "expense" | "capital";

// Savdo va sarmoya SO'MDA, rasxod DOLLARDA saqlanadi — jadval va balans uchun so'mga keltiramiz.
const txUzs = (t: { type: string; amount: number }) =>
  t.type === "expense" ? -usdToUzs(Number(t.amount)) : Number(t.amount) || 0;

const TYPE_UI: Record<TxType, { label: string; badge: string; text: string; button: string }> = {
  income: { label: "Savdo", badge: "bg-green-500/10 text-green-400", text: "text-green-400", button: "bg-green-400 hover:bg-green-500 shadow-green-500/20" },
  capital: { label: "Sarmoya", badge: "bg-purple-500/10 text-purple-400", text: "text-purple-400", button: "bg-purple-400 hover:bg-purple-500 shadow-purple-500/20" },
  expense: { label: "Rasxod", badge: "bg-red-500/10 text-red-400", text: "text-red-400", button: "bg-red-400 hover:bg-red-500 shadow-red-500/20" },
};
const uiOf = (type: string) => TYPE_UI[(type as TxType)] ?? TYPE_UI.expense;

export default function CashflowPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<ExpenseSegment | "">("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<"all" | "sales" | "expenses" | "capital">("all");

  const fetchData = async () => {
    try {
      // Audit X7: admin tekshiruvi bo'lgan server route orqali.
      const d = await dashLoad();
      setTransactions(d.transactions as never);
      setOrders(d.orders as Order[]);
      setProducts(d.products as never);
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
    const deliveredOrders = orders.filter(o => o.status === "delivered");
    const fin = summarizeFinances({ transactions, deliveredOrders, products });
    const totalSoldItems = deliveredOrders.reduce(
      (sum, o) => sum + (o.items ?? []).reduce((acc, i) => acc + (Number(i.quantity) || 0), 0),
      0
    );

    return {
      fin,
      incomeTransactions: transactions.filter(t => t.type === "income"),
      expenseTransactions: transactions.filter(t => t.type === "expense"),
      capitalTransactions: transactions.filter(t => t.type === "capital"),
      deliveredOrdersCount: deliveredOrders.length,
      totalSoldItems,
    };
  }, [transactions, orders, products]);

  // Running balance for table
  const txWithBalance = useMemo(() => {
    const wanted = activeView === "sales" ? "income" : activeView === "expenses" ? "expense" : activeView === "capital" ? "capital" : null;
    const filtered = wanted ? transactions.filter(t => t.type === wanted) : transactions;

    let runningBalance = 0;
    const result = [...filtered].reverse().map(tx => {
      runningBalance += txUzs(tx);
      return { ...tx, balance: runningBalance };
    });
    return result.reverse();
  }, [transactions, activeView]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (type === "expense" && !expenseCategory) {
      alert("Iltimos, rasxod turini tanlang");
      return;
    }

    try {
      const data = await dashInsert("transactions", [
        {
          type,
          amount: Number(amount),
          description,
          expense_category: type === "expense" ? expenseCategory : null,
        },
      ]);

      if (data && data[0]) {
        setTransactions([data[0] as never, ...transactions]);
      } else {
        fetchData();
      }
      setIsModalOpen(false);
      setAmount("");
      setDescription("");
      setExpenseCategory("");
    } catch (err) {
      console.error("Error saving transaction:", err);
      alert("Tranzaksiyani saqlashda xatolik yuz berdi!");
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!window.confirm("Bu tranzaksiyani o'chirishni xohlaysizmi?")) return;
    setTransactions(prev => prev.filter(t => t.id !== txId));
    try {
      await dashDelete("transactions", { id: txId });
    } catch (e) {
      // Audit D5/U4: o'chirish muvaffaqiyatsiz bo'lsa ro'yxatni tiklaymiz —
      // oldin UI o'chgandek ko'rsatib turaverardi.
      console.error("Tranzaksiyani o'chirib bo'lmadi", e);
      alert(e instanceof Error ? e.message : "O'chirib bo'lmadi");
      fetchData();
    }
  };

  // ── CSV EXPORT (Google Sheets uchun) ──────────
  const exportToCSV = () => {
    const now = new Date();
    const monthName = now.toLocaleDateString("uz-UZ", { year: "numeric", month: "long" });

    // Header
    let csv = "\uFEFF"; // BOM for Excel UTF-8
    csv += `Elore Parfume — Oylik Hisob-kitob (${monthName})\n\n`;

    // Summary
    const f = accounting.fin;
    csv += "XULOSA\n";
    csv += `Tikilgan pul (sarmoya),${Math.round(f.capitalUzs)} so'm\n`;
    csv += `Jami Savdo (tushum),${Math.round(f.salesUzs)} so'm\n`;
    csv += `Tovar xaridi,${Math.round(f.inventoryPurchasesUzs)} so'm\n`;
    csv += `Operatsion rasxod,${Math.round(f.operatingExpensesUzs)} so'm\n`;
    csv += `Jami rasxod,${Math.round(f.expensesUzs)} so'm (${f.expensesUsd})\n`;
    EXPENSE_SEGMENTS.forEach(seg => {
      csv += `  - ${EXPENSE_SEGMENT_LABELS[seg]},${Math.round(f.expenseSegmentsUzs[seg])} so'm\n`;
    });
    csv += `Sotilganlar tan narxi,${Math.round(f.cogsUzs)} so'm\n`;
    csv += `Sof Foyda,${Math.round(f.netProfitUzs)} so'm\n`;
    csv += `Kassa,${Math.round(f.cashUzs)} so'm\n`;
    csv += `Ombor (tan narxda),${Math.round(f.warehouseUzs)} so'm\n`;
    csv += `Jami boylik,${Math.round(f.totalWorthUzs)} so'm\n`;
    csv += `Haqiqiy foyda (boylik - sarmoya),${Math.round(f.realProfitUzs)} so'm\n\n`;

    const section = (title: string, list: Transaction[]) => {
      csv += `${title}\n`;
      csv += "Sana,Tavsif,Summa (so'm)\n";
      let total = 0;
      list.forEach(tx => {
        const date = new Date(tx.created_at).toLocaleDateString("uz-UZ");
        const v = Math.round(txUzs(tx));
        total += v;
        csv += `${date},"${tx.description}",${v}\n`;
      });
      csv += `,,Jami: ${total}\n\n`;
    };
    section("SARMOYA", accounting.capitalTransactions);
    section("SAVDO (KIRIM)", accounting.incomeTransactions);
    section("RASXODLAR (CHIQIM)", accounting.expenseTransactions);

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
              setExpenseCategory("");
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Tikilgan pul (sarmoya)", value: accounting.fin.capitalUzs, tone: "text-purple-400", border: "border-l-purple-500/50", hint: `${accounting.capitalTransactions.length} ta yozuv` },
          { label: "Jami Savdo", value: accounting.fin.salesUzs, tone: "text-blue-400", border: "border-l-blue-500/50", hint: `${accounting.totalSoldItems} ta atir (${accounting.deliveredOrdersCount} ta buyurtma)` },
          { label: "Jami rasxod", value: accounting.fin.expensesUzs, tone: "text-red-400", border: "border-l-red-500/50", hint: "tarkibi pastda" },
          { label: "Ombor (tan narxda)", value: accounting.fin.warehouseUzs, tone: "text-orange-400", border: "border-l-orange-500/50", hint: `${accounting.fin.warehouseItems} dona atir` },
          { label: "Sof Foyda", value: accounting.fin.netProfitUzs, tone: accounting.fin.netProfitUzs >= 0 ? "text-green-400" : "text-red-400", border: "border-l-green-500/50", hint: "savdo − tan narx − operatsion" },
          { label: "Kassa", value: accounting.fin.cashUzs, tone: accounting.fin.cashUzs >= 0 ? "text-gradient-gold" : "text-red-400", border: "border-l-gold/50", hint: "sarmoya + savdo − barcha rasxod" },
        ].map(c => (
          <div key={c.label} className={`glass-card rounded-xl p-5 border-l-4 ${c.border}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">{c.label}</p>
            <p className={`text-xl lg:text-2xl font-bold break-words ${c.tone}`}>{fmt(c.value)} so&apos;m</p>
            <p className="text-[10px] text-muted-foreground mt-1">{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Rasxodlar tarkibi</p>
          <p className="text-sm font-bold text-red-400">Jami: {fmt(accounting.fin.expensesUzs)} so&apos;m</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {EXPENSE_SEGMENTS.map(seg => (
            <div key={seg} className="rounded-lg bg-secondary/40 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">{EXPENSE_SEGMENT_LABELS[seg]}</p>
              <p className="text-sm font-semibold text-foreground">{fmt(accounting.fin.expenseSegmentsUzs[seg])} so&apos;m</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* FILTER TABS                                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-secondary/50 backdrop-blur-sm w-fit">
        {(["all", "sales", "expenses", "capital"] as const).map(v => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              activeView === v
                ? "bg-gradient-gold text-black shadow-lg shadow-gold/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v === "all" ? "Barchasi" : v === "sales" ? "💰 Savdo" : v === "expenses" ? "📉 Rasxodlar" : "🏦 Sarmoya"}
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
                      uiOf(tx.type).badge
                    }`}>
                      {tx.type !== "expense" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" /></svg>
                      )}
                      {uiOf(tx.type).label}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-foreground">{tx.description}</td>
                  <td className={`px-6 py-3 text-sm font-bold whitespace-nowrap ${uiOf(tx.type).text}`}>
                    {txUzs(tx) >= 0 ? "+" : "−"}{fmt(Math.abs(txUzs(tx)))} so&apos;m
                  </td>
                  <td className={`px-6 py-3 text-sm font-bold ${tx.balance >= 0 ? "text-gradient-gold" : "text-red-400"}`}>
                    {fmt(tx.balance)} so'm
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
                  onClick={() => setType("capital")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                    type === "capital" ? "bg-purple-500/20 text-purple-400" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sarmoya
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

              {type === "expense" && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Kategoriya</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-xl">
                    {EXPENSE_SEGMENTS.map(seg => (
                      <button
                        key={seg}
                        type="button"
                        onClick={() => setExpenseCategory(seg)}
                        className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                          expenseCategory === seg ? "bg-gold/20 text-gold" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {EXPENSE_SEGMENT_LABELS[seg]}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Faqat &quot;Atir xaridi&quot; omborga (aktiv) yoziladi — qolganlari darhol foydadan ayiriladi.</p>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">{type === "expense" ? "Summa ($)" : "Summa (so'm)"}</label>
                <input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-lg font-bold text-foreground focus:outline-none focus:border-gold/50" />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Tavsif (Sabab)</label>
                <input required type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === "expense" ? "Masalan: Target reklama, Yetkazish" : type === "capital" ? "Masalan: Dilmurod tikgan pul" : "Masalan: Buyurtma #123 daromadi"} className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-gold/50" />
              </div>

              <button type="submit" className={`w-full py-3.5 mt-2 rounded-xl font-bold uppercase tracking-wider text-sm transition-all text-black shadow-lg ${
                uiOf(type).button
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
