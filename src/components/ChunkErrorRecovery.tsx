"use client";

import { useEffect } from "react";

/**
 * Deploy paytida sayt ochiq turgan foydalanuvchida eski JS chunk'lar 404 bo'ladi
 * va sahifa "sinadi" (ChunkLoadError). Bu komponent shuni ushlab, sahifani
 * bir marta qayta yuklaydi — foydalanuvchi hech narsani sezmaydi.
 */
export default function ChunkErrorRecovery() {
  useEffect(() => {
    const KEY = "chunk_reload_at";

    const isChunkError = (v: unknown) => {
      const msg =
        (v as { message?: string })?.message ||
        (v as { name?: string })?.name ||
        String(v || "");
      return /ChunkLoadError|Loading chunk .* failed|Failed to load chunk|Importing a module script failed/i.test(
        msg
      );
    };

    const recover = () => {
      // Cheksiz qayta yuklanishning oldini olamiz: 1 daqiqada faqat 1 marta
      const last = Number(sessionStorage.getItem(KEY) || 0);
      if (Date.now() - last < 60000) return;
      sessionStorage.setItem(KEY, String(Date.now()));
      window.location.reload();
    };

    const onError = (e: ErrorEvent) => {
      if (isChunkError(e.error) || isChunkError(e.message)) recover();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      if (isChunkError(e.reason)) recover();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
