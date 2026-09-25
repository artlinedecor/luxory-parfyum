"use client";

import { useState } from "react";
import { dashInsert } from "@/lib/dashboard-api";
import { EXPENSE_SEGMENTS, EXPENSE_SEGMENT_LABELS, type ExpenseSegment } from "@/lib/accounting";
import type { Transaction } from "@/lib/types";

const NBSP = " ";
const group = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

const HINT: Record<ExpenseSegment, string> = {
  inventory: "sotish uchun olingan atir — omborga yoziladi, foydani kamaytirmaydi",
  cargo: "atirni olib kelish, pochta, yo'l haqi",
  ads: "Instagram / Target reklama",
  services: "ChatGPT, davlat xizmatlari, obunalar",
  deposit: "qaytib keladigan pul (masalan Uzum depoziti)",
  other: "boshqa har qanday xarajat",
};

/** Rasxod kiritish — turini (segment) tanlash majburiy. Summa dollarda, kiritilgan kundagi kurs bilan saqlanadi. */
export default function AddExpenseButton({ rate, onSaved }: { rate: number; onSaved: (tx: Transaction) => void }) {
  const [open, setOpen] = useState(false);
  const [segment, setSegment] = useState<ExpenseSegment | "">("");
  const [amount, setAmount] = useState("");
  const [what, setWhat] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    setOpen(false);
    setSegment("");
    setAmount("");
    setWhat("");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!segment) {
      alert("Rasxod turini tanlang");
      return;
    }
    const usd = Number(amount);
    if (!(usd > 0)) {
      alert("Summani dollarda kiriting, masalan 25");
      return;
    }
    setSaving(true);
    try {
      const [tx] = await dashInsert<Transaction>("transactions", [
        { type: "expense", amount: usd, description: what.trim(), expense_category: segment, usd_rate: rate },
      ]);
      if (tx) onSaved(tx);
      close();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Rasxod saqlanmadi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-gradient-gold text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-[0.97] transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Rasxod kiritish
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4" onClick={close}>
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-background border border-border rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Yangi rasxod</h3>
              <button type="button" onClick={close} className="w-11 h-11 -mr-2 flex items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Yopish">✕</button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">1. Nimaga ketdi?</p>
              <div className="grid grid-cols-2 gap-2">
                {EXPENSE_SEGMENTS.map(seg => (
                  <button
                    key={seg}
                    type="button"
                    onClick={() => setSegment(seg)}
                    aria-pressed={segment === seg}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-sm text-left transition-all ${
                      segment === seg ? "border-gold bg-gold/15 text-gold font-semibold" : "border-border text-foreground hover:border-gold/40"
                    }`}
                  >
                    {EXPENSE_SEGMENT_LABELS[seg]}
                  </button>
                ))}
              </div>
              {segment && <p className="text-[11px] text-muted-foreground">{HINT[segment]}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="exp-amount" className="text-xs text-muted-foreground uppercase tracking-wider">2. Qancha? (dollarda)</label>
              <input
                id="exp-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25"
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-lg font-bold text-foreground focus:outline-none focus:border-gold/50"
              />
              <p className="text-[11px] text-muted-foreground">
                {Number(amount) > 0 ? `≈ ${group(Number(amount) * rate)} so'm` : "so'mga"} · kurs 1 $ = {group(rate)} so&apos;m
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="exp-what" className="text-xs text-muted-foreground uppercase tracking-wider">3. Izoh</label>
              <input
                id="exp-what"
                type="text"
                required
                value={what}
                onChange={(e) => setWhat(e.target.value)}
                placeholder={segment === "inventory" ? "Masalan: Hilola uchun Symphony" : segment === "cargo" ? "Masalan: Turkiyadan kargo 3 kg" : "Masalan: Target reklama"}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-gold/50"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full min-h-[50px] rounded-xl bg-gradient-gold text-black font-bold text-sm uppercase tracking-wider disabled:opacity-50"
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
