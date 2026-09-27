"use client";

import { splitMinutes } from "@/config/promo";
import { usePromoMinutesLeft } from "@/lib/use-promo";

/**
 * Oktyabr aksiyasi tugashigacha: kun · soat · daqiqa (config/promo.ts).
 *
 * - Raqamlar faqat client'da, mount'dan keyin chiqadi (server HTML'da
 *   ko'rinmas "00" — joy oldindan band, CLS 0, hydration mos).
 * - Har daqiqa almashganda yangilanadi; o'zgargan raqam yumshoq
 *   "tushib keladi" (.cd-tick, globals.css — reduced-motion'da o'chadi).
 * - Aksiya tugagach hech narsa chizmaydi.
 */

type Variant = "tiles" | "inline" | "compact";

const UNITS = {
  uz: { d: "kun", h: "soat", m: "daqiqa", mShort: "daq" },
  ru: { d: "дн", h: "ч", m: "мин", mShort: "мин" },
} as const;

const pad = (n: number) => String(n).padStart(2, "0");

/** Raqam: qiymat o'zgarsa key o'zgaradi → span qayta chiziladi → animatsiya */
function Digits({ value, ready, className = "" }: { value: number; ready: boolean; className?: string }) {
  return (
    <span className={`inline-block overflow-hidden align-bottom tabular-nums ${className}`}>
      <span key={ready ? value : "x"} className={ready ? "cd-tick inline-block" : "invisible inline-block"}>
        {pad(value)}
      </span>
    </span>
  );
}

export default function PromoCountdown({
  lang,
  variant = "inline",
  className = "",
}: {
  lang: "uz" | "ru";
  variant?: Variant;
  className?: string;
}) {
  const left = usePromoMinutesLeft();
  if (left === null) return null;

  const ready = left !== undefined;
  const { days, hours, minutes } = splitMinutes(left ?? 0);
  const u = UNITS[lang];
  const label = ready
    ? lang === "ru"
      ? `До конца акции ${days} дн. ${hours} ч ${minutes} мин`
      : `Aksiya tugashiga ${days} kun ${hours} soat ${minutes} daqiqa`
    : undefined;

  if (variant === "tiles") {
    const parts = [
      { v: days, unit: u.d },
      { v: hours, unit: u.h },
      { v: minutes, unit: u.mShort },
    ];
    return (
      <span role="timer" aria-label={label} className={`flex items-center gap-1.5 ${className}`}>
        {parts.map((p, i) => (
          <span key={i} aria-hidden className="flex min-w-[46px] flex-col items-center rounded-xl bg-white/[0.08] px-2 pt-1.5 pb-1 ring-1 ring-inset ring-white/10">
            <Digits value={p.v} ready={ready} className="font-heading text-[17px] font-semibold leading-none text-white" />
            <span className="mt-1 text-[10px] leading-none text-white/55">{p.unit}</span>
          </span>
        ))}
      </span>
    );
  }

  const size = variant === "compact" ? "text-[12px]" : "text-[13px]";
  return (
    <span role="timer" aria-label={label} className={`inline-flex items-baseline gap-1 whitespace-nowrap ${size} ${className}`}>
      <span aria-hidden className={`inline-flex items-baseline gap-1 ${ready ? "" : "invisible"}`}>
        <Digits value={days} ready={ready} className="font-semibold" />
        <span className="opacity-70">{u.d}</span>
        <Digits value={hours} ready={ready} className="ml-0.5 font-semibold" />
        <span className="opacity-70">{u.h}</span>
        <Digits value={minutes} ready={ready} className="ml-0.5 font-semibold" />
        <span className="opacity-70">{variant === "compact" ? u.mShort : u.m}</span>
      </span>
    </span>
  );
}
