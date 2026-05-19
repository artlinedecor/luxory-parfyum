"use client";

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
  // If already SHA-256 format
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

export async function trackMetaEvent(
  eventName: string,
  eventId: string,
  userData?: { client_name?: string; client_phone?: string },
  customData?: { value?: number; currency?: string; [key: string]: any }
) {
  if (typeof window === "undefined") return;

  const fbp = getCookie("_fbp");
  const fbc = getCookie("_fbc");

  // Hash name and phone on client-side
  let hashedName: string | null = null;
  let hashedPhone: string | null = null;

  if (userData?.client_name) {
    hashedName = await hashValue(userData.client_name);
  }
  if (userData?.client_phone) {
    hashedPhone = await hashValue(userData.client_phone);
  }

  // 1. Client-Side standard Pixel track
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

  // 2. Server-Side CAPI tracking (fire-and-forget in the background)
  try {
    fetch("/api/meta-capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: eventName,
        event_id: eventId,
        event_source_url: window.location.href,
        user_data: {
          client_name: hashedName || userData?.client_name,
          client_phone: hashedPhone || userData?.client_phone,
          fbp,
          fbc,
        },
        custom_data: customData,
      }),
    }).catch((err) => console.warn("Meta CAPI fetch failed:", err));
  } catch (e) {
    console.warn("Meta CAPI dispatch failed:", e);
  }
}
