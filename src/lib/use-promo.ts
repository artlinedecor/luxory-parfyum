"use client";

import { useSyncExternalStore } from "react";
import { isPromoActive, promoDaysLeft } from "@/config/promo";

/**
 * Soat bilan sinxron turadigan "tashqi do'kon": har daqiqada va sahifa
 * qayta ko'ringanda tekshiradi — ochiq turgan sahifada ham aksiya
 * endsAt o'tishi bilan yo'qoladi.
 */
function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 60_000);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onChange);
  };
}

const activeNow = () => isPromoActive(Date.now());

/** Aksiya hozir faolmi — server ham, client ham bir xil qoida (config/promo.ts). */
export function usePromoActive(): boolean {
  return useSyncExternalStore(subscribe, activeNow, activeNow);
}

const daysNow = () => promoDaysLeft(Date.now());
const daysOnServer = () => null;

/**
 * Qolgan kunlar — faqat client'da (server HTML'da null). Shunda keshlangan
 * sahifada kechagi son qolib ketmaydi va hydration mos keladi.
 */
export function usePromoDaysLeft(): number | null {
  return useSyncExternalStore(subscribe, daysNow, daysOnServer);
}
