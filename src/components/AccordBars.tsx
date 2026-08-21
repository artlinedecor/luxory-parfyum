"use client";

import { useI18n } from "@/lib/i18n-context";
import type { Accord } from "@/lib/fragrance";

/**
 * Akkord balansi — atir xarakterini ko'rsatuvchi vizual chiziqlar.
 * Masalan: Yog'ochli 85%, Shirin 60%, O'tkir 40%.
 */
export default function AccordBars({
  accords,
  limit = 5,
  compact = false,
}: {
  accords: Accord[];
  limit?: number;
  compact?: boolean;
}) {
  const { lang } = useI18n();
  const rows = accords.slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <section className={compact ? "space-y-3" : "space-y-4"}>
      {!compact && (
        <h2 className="font-heading text-2xl text-foreground">
          {lang === "ru" ? "Баланс аккордов" : "Akkord balansi"}
        </h2>
      )}

      <ul className="space-y-2.5">
        {rows.map((a) => {
          const pct = Math.max(0, Math.min(100, Math.round(a.strength)));
          return (
            <li key={a.name} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-muted-foreground truncate">
                {a.name}
              </span>
              <span
                className="relative flex-1 h-[3px] bg-border overflow-hidden"
                role="meter"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={a.name}
              >
                <span
                  className="absolute inset-y-0 left-0 bg-gold-dark"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
