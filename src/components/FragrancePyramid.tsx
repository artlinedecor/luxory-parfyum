"use client";

import { useI18n } from "@/lib/i18n-context";
import type { FragranceNotes } from "@/lib/fragrance";

/**
 * Notalar piramidasi: bosh -> yurak -> asosiy (shleyf).
 * Ma'lumot bo'lmasa hech narsa chizmaydi.
 */
export default function FragrancePyramid({ notes }: { notes: FragranceNotes }) {
  const { lang } = useI18n();

  const rows = [
    {
      key: "top",
      items: notes.top,
      label: lang === "ru" ? "Верхние ноты" : "Bosh notalar",
      hint: lang === "ru" ? "первые минуты" : "birinchi daqiqalar",
    },
    {
      key: "heart",
      items: notes.heart,
      label: lang === "ru" ? "Ноты сердца" : "Yurak notalari",
      hint: lang === "ru" ? "основной характер" : "asosiy xarakter",
    },
    {
      key: "base",
      items: notes.base,
      label: lang === "ru" ? "Базовые ноты" : "Asosiy notalar",
      hint: lang === "ru" ? "шлейф" : "shleyf",
    },
  ].filter((r) => r.items.length > 0);

  if (rows.length === 0) return null;

  return (
    <section className="space-y-6">
      <h2 className="font-heading text-2xl text-foreground">
        {lang === "ru" ? "Пирамида аромата" : "Notalar piramidasi"}
      </h2>

      <div className="space-y-5">
        {rows.map((row, i) => (
          <div key={row.key} className="relative pl-6">
            {/* Vertikal chiziq — piramidaning bosqichlarini bog'laydi */}
            <span
              aria-hidden
              className="absolute left-[3px] top-2 bottom-0 w-px bg-border"
              style={{ display: i === rows.length - 1 ? "none" : undefined }}
            />
            <span
              aria-hidden
              className="absolute left-0 top-1.5 w-[7px] h-[7px] rounded-full bg-gold"
            />

            <div className="flex items-baseline gap-2">
              <h3 className="eyebrow text-foreground">{row.label}</h3>
              <span className="text-[10px] text-muted-foreground">
                {row.hint}
              </span>
            </div>

            <p className="mt-2 font-heading text-lg text-foreground/85 leading-relaxed">
              {row.items.join(" · ")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
