import { PROMO } from "@/config/promo";
import { formatUzs } from "@/lib/utils";

/**
 * Aksiya belgisi va chizilgan eski narx — kartochka, lenta, atir sahifasi
 * uchun bitta ko'rinish. Qachon ko'rsatishni chaqiruvchi hal qiladi
 * (usePromoActive + promoOldPriceFor).
 */

/**
 * "−20%" — Uzum binafsha, Unbounded, raqamlar tekis.
 * `shine` — bir necha soniyada bir marta yaltirash (.promo-shine, globals.css).
 * Katalog to'rida o'chiq: 24 ta kartada birdan yaltirash shovqin bo'ladi.
 */
export function PromoPercentBadge({ className = "", shine = false }: { className?: string; shine?: boolean }) {
  return (
    <span
      className={`inline-flex items-center overflow-hidden rounded-full bg-[#6100ff] px-2 py-1 font-heading text-[11px] font-semibold leading-none text-white tabular-nums ${shine ? "promo-shine relative" : ""} ${className}`}
    >
      −{PROMO.percent}%
    </span>
  );
}

/** Chizilgan eski narx. Ekran o'quvchi "eski narx" deb eshitadi. */
export function PromoOldPrice({
  amount,
  ru,
  withCurrency = false,
  className = "",
}: {
  amount: number;
  ru: boolean;
  withCurrency?: boolean;
  className?: string;
}) {
  return (
    <s className={`tabular-nums whitespace-nowrap decoration-[1.5px] ${className}`}>
      <span className="sr-only">{ru ? "Старая цена: " : "Eski narx: "}</span>
      {formatUzs(amount)}
      {withCurrency ? (ru ? " сум" : " so'm") : ""}
    </s>
  );
}
