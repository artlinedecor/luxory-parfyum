"use client";

import { useState } from "react";
import { dashSetUsdRate } from "@/lib/dashboard-api";
import { isValidUsdRate, USD_RATE_MIN, USD_RATE_MAX } from "@/lib/accounting";

const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU").replace(/,/g, " ");

/**
 * Buxgalteriya kursi ($ → so'm) — ko'rsatish va o'zgartirish.
 * Yangi kurs faqat bundan keyingi rasxod va qo'lda buyurtmalarga
 * yoziladi; ombor va tan narx esa joriy kurs bilan qayta baholanadi.
 */
export default function UsdRateEditor({ rate, onChange }: { rate: number; onChange: (rate: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const start = () => {
    setValue(String(rate));
    setEditing(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Math.round(Number(value));
    if (!isValidUsdRate(n)) {
      alert(`Kurs ${fmt(USD_RATE_MIN)} – ${fmt(USD_RATE_MAX)} so'm oralig'ida bo'lishi kerak`);
      return;
    }
    if (n === rate) {
      setEditing(false);
      return;
    }
    if (!window.confirm(
      `Kurs ${fmt(rate)} → ${fmt(n)} so'm bo'ladi.\n\n` +
      `Bundan keyingi rasxodlar va qo'lda buyurtmalar yangi kurs bilan hisoblanadi. ` +
      `Eski yozuvlar o'z kursida qoladi. Ombor va tan narx yangi kurs bilan qayta baholanadi.`
    )) return;

    setSaving(true);
    try {
      onChange(await dashSetUsdRate(n));
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kurs saqlanmadi");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={start}
        title="Kursni o'zgartirish"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-secondary/40 text-xs text-muted-foreground hover:border-gold/40 hover:text-foreground transition-all"
      >
        <span>Kurs:</span>
        <span className="font-bold text-foreground">1 $ = {fmt(rate)} so&apos;m</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gold" aria-hidden="true">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
    );
  }

  return (
    <form onSubmit={save} className="inline-flex items-center gap-2 px-2 py-1.5 rounded-xl border border-gold/40 bg-secondary/40">
      <label htmlFor="usd-rate" className="text-xs text-muted-foreground pl-2">1 $ =</label>
      <input
        id="usd-rate"
        type="number"
        inputMode="numeric"
        min={USD_RATE_MIN}
        max={USD_RATE_MAX}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24 px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm font-bold text-foreground focus:outline-none focus:border-gold/50"
      />
      <span className="text-xs text-muted-foreground">so&apos;m</span>
      <button type="submit" disabled={saving} className="px-3 py-1.5 rounded-lg bg-gradient-gold text-black text-xs font-bold disabled:opacity-50">
        {saving ? "..." : "Saqlash"}
      </button>
      <button type="button" onClick={() => setEditing(false)} disabled={saving} className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground">
        Bekor
      </button>
    </form>
  );
}
