"use client";

import { useEffect, useState } from "react";
import type { MissingPerfume } from "@/lib/missing-perfumes";

const day = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });

/** Omborxona: mijozlar so'ragan, katalogda yo'q atirlar (ChatPlace bot havolasidan). */
export default function MissingPerfumes() {
  const [items, setItems] = useState<MissingPerfume[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/missing-perfumes", { credentials: "same-origin", cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `Xatolik (${r.status})`);
        setItems(j.items ?? []);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const remove = async (slug: string) => {
    const r = await fetch(`/api/dashboard/missing-perfumes?slug=${encodeURIComponent(slug)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (r.ok) setItems((l) => (l ?? []).filter((m) => m.slug !== slug));
  };

  if (error) return <p className="text-xs text-red-400">So&apos;ralgan atirlar: {error}</p>;
  if (!items) return null;

  return (
    <section className="rounded-2xl border border-border/50 bg-secondary/20 p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-foreground">Mijozlar so&apos;ragan, katalogda yo&apos;q atirlar</h2>
      <p className="text-xs text-muted-foreground mt-1">
        ChatPlace bot yuborgan havola saytda atir topmaganda yoziladi. Saytga qo&apos;shgach, &quot;Qo&apos;shildi&quot;ni bosing.
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-4">Hozircha yo&apos;q.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border/40">
          {items.map((m) => (
            <li key={m.slug} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.count} marta so&apos;raldi · oxirgi: {day(m.lastAt)}
                </p>
              </div>
              <button
                onClick={() => remove(m.slug)}
                className="shrink-0 min-h-11 px-3 rounded-lg border border-border/60 text-xs font-semibold hover:bg-secondary/40"
              >
                Qo&apos;shildi ✓
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
