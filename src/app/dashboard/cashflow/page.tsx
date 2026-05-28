"use client";

import React, { useState, useEffect } from "react";
import { Transaction } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

export default function CashflowPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const txWithBalance = React.useMemo(() => {
    let runningBalance = 0;
    const reversed = [...transactions].reverse();
    const result = reversed.map(tx => {
      if (tx.type === "income") runningBalance += Number(tx.amount);
      else runningBalance -= Number(tx.amount);
      return { ...tx, balance: runningBalance };
    });
    return result.reverse();
  }, [transactions]);

  const fetchTransactions = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (e) {
      console.error("Error fetching transactions:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchTransactions();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    const txData = {
      type,
      amount: Number(amount),
      description,
    };

    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert([txData])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setTransactions([data[0], ...transactions]);
      } else {
        fetchTransactions();
      }
      setIsModalOpen(false);
      setAmount("");
      setDescription("");
    } catch (err) {
      console.error("Error saving transaction:", err);
      alert("Tranzaksiyani saqlashda xatolik yuz berdi!");
    }
  };

  const totalIncome = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            <span className="text-gradient-gold">Kassa jurnali</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kirim va chiqimlar tarixi (Buxgalteriya)
          </p>
        </div>
        <button
          onClick={() => {
            setType("income");
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-green-500/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Kirim (Umumiy)</p>
          <p className="text-2xl font-bold text-green-400">+${totalIncome}</p>
        </div>
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-red-500/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Chiqim (Umumiy)</p>
          <p className="text-2xl font-bold text-red-400">-${totalExpense}</p>
        </div>
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-gold/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Qoldiq</p>
          <p className="text-2xl font-bold text-gradient-gold">${netProfit}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Turi</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Tavsif (Sabab)</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Summa</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Balans</th>
                <th className="px-6 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right">Sana</th>
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
                      {tx.type === "income" ? "Kirim" : "Chiqim"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-foreground">{tx.description}</td>
                  <td className={`px-6 py-3 text-sm font-bold ${tx.type === "income" ? "text-green-400" : "text-red-400"}`}>
                    {tx.type === "income" ? "+" : "-"}${tx.amount}
                  </td>
                  <td className={`px-6 py-3 text-sm font-bold ${tx.balance >= 0 ? "text-gradient-gold" : "text-red-400"}`}>
                    ${tx.balance}
                  </td>
                  <td className="px-6 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                    {isMounted ? new Date(tx.created_at).toLocaleString("uz-UZ", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "..."}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">
                    Tranzaksiyalar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
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
                  Kirim
                </button>
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                    type === "expense" ? "bg-red-500/20 text-red-400" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Chiqim
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Summa ($)</label>
                <input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-lg font-bold text-foreground focus:outline-none focus:border-gold/50" />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Tavsif (Sabab)</label>
                <input required type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Masalan: Tovar xaridi" className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-gold/50" />
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
