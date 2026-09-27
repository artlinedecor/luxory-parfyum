"use client";

import { useSyncExternalStore } from "react";
import { isPromoActive, msToNextMinuteTick, promoMinutesLeft } from "@/config/promo";

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

/**
 * Countdown obunasi: taymer aynan daqiqa almashadigan paytga tekislanadi
 * (har soniyada uyg'onmaydi); sahifa qayta ko'ringanda ham yangilanadi.
 */
function subscribeMinute(onChange: () => void) {
  let id = 0;
  const schedule = () => {
    id = window.setTimeout(() => {
      onChange();
      schedule();
    }, msToNextMinuteTick(Date.now()) + 20);
  };
  schedule();
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearTimeout(id);
    document.removeEventListener("visibilitychange", onChange);
  };
}

const minutesNow = () => promoMinutesLeft(Date.now());
const minutesOnServer = () => undefined;

/**
 * Tugashigacha qolgan daqiqalar — faqat client'da:
 * `undefined` — server HTML / hydration (raqam yo'q, joy band turadi),
 * `null` — aksiya tugagan, son — faol. Keshlangan sahifada eski son
 * qolib ketmaydi va hydration mos keladi.
 */
export function usePromoMinutesLeft(): number | null | undefined {
  return useSyncExternalStore(subscribeMinute, minutesNow, minutesOnServer);
}
