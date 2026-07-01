"use client";

import { normalizePhone, splitName } from "@/lib/meta-normalize";

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
}

export async function hashValue(value: string): Promise<string | null> {
  if (!value) return null;
  const clean = value.trim().toLowerCase();
  // Agar allaqachon SHA-256 formatida bo'lsa
  if (/^[0-9a-f]{64}$/i.test(clean)) return clean;
  try {
    const msgBuffer = new TextEncoder().encode(clean);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    console.error("SHA256 error:", e);
    return null;
  }
}

// Ism/telefonni normalizatsiya qilib, hash'langan fn/ln/ph qaytaradi (client-side crypto).
async function buildHashedUserData(userData?: { client_name?: string; client_phone?: string }) {
  const { first, last } = splitName(userData?.client_name);
  const phone = normalizePhone(userData?.client_phone);
  const [fn, ln, ph] = await Promise.all([
    first ? hashValue(first) : Promise.resolve(null),
    last ? hashValue(last) : Promise.resolve(null),
    phone ? hashValue(phone) : Promise.resolve(null),
  ]);
  return { fn, ln, ph };
}

export async function trackMetaEvent(
  eventName: string,
  eventId: string,
  userData?: { client_name?: string; client_phone?: string },
  customData?: { value?: number; currency?: string; [key: string]: any }
) {
  if (typeof window === "undefined") return;

  const fbp = getCookie("_fbp");
  const fbc = getCookie("_fbc");
  const { fn, ln, ph } = await buildHashedUserData(userData);

  // 1. Client-Side standard Pixel track (browser)
  if (window.fbq) {
    try {
      if (eventName === "PageView") {
        window.fbq("track", "PageView", {}, { eventID: eventId });
      } else {
        window.fbq("track", eventName, customData || {}, { eventID: eventId });
      }
    } catch (e) {
      console.warn("Client Meta Pixel track call failed:", e);
    }
  }

  // 2. Server-Side CAPI tracking (fire-and-forget, orqa fonda)
  try {
    fetch("/api/meta-capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: eventName,
        event_id: eventId,
        action_source: "website",
        event_source_url: window.location.href,
        user_data: { fn, ln, ph, fbp, fbc },
        custom_data: customData,
      }),
    }).catch((err) => console.warn("Meta CAPI fetch failed:", err));
  } catch (e) {
    console.warn("Meta CAPI dispatch failed:", e);
  }
}

/**
 * DM (Instagram/Telegram) yoki qo'lda savdolar uchun — FAQAT server CAPI ga yuboradi
 * (brauzer Pixel'ni ishga tushirmaydi, chunki DM'da brauzer foydalanuvchisi yo'q).
 * action_source: "chat" — chat/messaging orqali bo'lgan konversiya.
 */
export async function trackDmConversion(params: {
  eventName?: string; // default "Purchase"
  eventId?: string;
  clientName?: string;
  clientPhone?: string;
  value?: number;
  currency?: string;
  customData?: Record<string, unknown>;
}): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const eventName = params.eventName || "Purchase";
  const eventId =
    params.eventId ||
    `dm_${eventName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const { fn, ln, ph } = await buildHashedUserData({
    client_name: params.clientName,
    client_phone: params.clientPhone,
  });

  try {
    const res = await fetch("/api/meta-capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: eventName,
        event_id: eventId,
        action_source: "chat",
        event_source_url: window.location.href,
        user_data: { fn, ln, ph },
        custom_data: {
          value: params.value,
          currency: params.currency || "USD",
          ...(params.customData || {}),
        },
      }),
    });
    return res.ok;
  } catch (e) {
    console.warn("DM CAPI conversion failed:", e);
    return false;
  }
}
