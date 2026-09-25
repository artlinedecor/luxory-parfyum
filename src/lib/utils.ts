import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const EXCHANGE_RATE = 12100;
const PREMIUM_EXTRA_FEE = 40000;
const ORIGINAL_EXTRA_USD = 100;

export function calculateOriginalPriceUzs(priceUsd: number): number {
  if (priceUsd === 0.01) return 1000;
  return (priceUsd + ORIGINAL_EXTRA_USD) * EXCHANGE_RATE;
}

export function calculatePremiumPriceUzs(priceUsd: number): number {
  if (priceUsd === 0.01) return 1000;
  return 800000;
}

/**
 * 800 000 — guruhlar uzilmas probel bilan, butun songa yaxlitlangan.
 * Intl('uz-UZ') ishlatilmaydi: ko'p Android WebView'da bu lokal yo'q va
 * narx "800,000" bo'lib chiqardi (jonli saytda shunday edi).
 */
export function formatUzs(amount: number): string {
  const n = Math.round(Number(amount) || 0);
  const s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return n < 0 ? `−${s}` : s;
}
