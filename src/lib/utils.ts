import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const EXCHANGE_RATE = 12100;
const PREMIUM_EXTRA_FEE = 40000;
const ORIGINAL_EXTRA_USD = 100;

export function calculateOriginalPriceUzs(priceUsd: number): number {
  return (priceUsd + ORIGINAL_EXTRA_USD) * EXCHANGE_RATE;
}

export function calculatePremiumPriceUzs(priceUsd: number): number {
  return (priceUsd * EXCHANGE_RATE) + PREMIUM_EXTRA_FEE;
}

export function formatUzs(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount);
}
