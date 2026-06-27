"use client";

import React, { useState, useEffect } from "react";

export default function PwaInstallHelper() {
  const [showHelper, setShowHelper] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"android" | "ios">("android");

  useEffect(() => {
    // Detect Standalone Mode (PWA is already installed)
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Already installed, do not show
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOSDevice) {
      setActiveTab("ios");
    } else {
      setActiveTab("android");
    }

    // Capture Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setActiveTab("android");
      setShowHelper(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Fallback: Always show on mobile devices to let them know they can install
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      setShowHelper(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowHelper(false);
      }
    } else {
      alert("Ilovani o'rnatish uchun brauzeringiz menyusidan (3 ta nuqta) 'Ilovani o'rnatish' (Добавить на гл. экран) tanlang.");
    }
  };

  if (!showHelper) return null;

  return (
    <div className="glass-card rounded-3xl p-6 border border-gold/30 shadow-2xl max-w-sm mx-auto my-6 bg-[#090909]/95 backdrop-blur-xl relative overflow-hidden text-center animate-scale-in">
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-gold/5 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 border-b border-border/40 pb-3">
        <h3 className="text-sm font-bold text-foreground tracking-wider flex items-center gap-2">
          📲 MOBIL ILOVA O&apos;RNATISH
        </h3>
        <button 
          onClick={() => setShowHelper(false)} 
          className="text-muted-foreground hover:text-foreground p-1 transition-colors"
          title="Yopish"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 mb-5 bg-[#141414] p-1 rounded-2xl border border-border/30">
        <button
          onClick={() => setActiveTab("android")}
          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "android"
              ? "bg-gradient-gold text-black shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Android / Chrome
        </button>
        <button
          onClick={() => setActiveTab("ios")}
          className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "ios"
              ? "bg-gradient-gold text-black shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          iPhone / iOS
        </button>
      </div>

      {activeTab === "android" ? (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed px-1">
            Lux Atir boshqaruv panelini telefoningizga yuklab oling va brauzersiz tezkor ishlating.
          </p>
          <button
            onClick={handleInstallClick}
            className="w-full py-3 rounded-2xl bg-gradient-gold text-black font-bold uppercase tracking-wider text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/25"
          >
            📲 O&apos;RNATISH (INSTAL)
          </button>
        </div>
      ) : (
        <div className="space-y-4 text-left">
          <div className="bg-[#141414] p-4 rounded-2xl border border-border/20 space-y-3">
            <h4 className="text-xs font-bold text-gold uppercase tracking-wider">iPhone-ga O&apos;rnatish:</h4>
            
            <div className="flex gap-2.5 items-start text-xs text-muted-foreground">
              <span className="bg-gold/10 text-gold w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">1</span>
              <span>
                Safari brauzerida pastdagi <strong className="text-foreground">[↑] (Share / Ulashish)</strong> tugmasini bosing.
              </span>
            </div>
            
            <div className="flex gap-2.5 items-start text-xs text-muted-foreground">
              <span className="bg-gold/10 text-gold w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">2</span>
              <span>
                Menyudan pastga tushib <strong className="text-foreground">&quot;Ekran kabi qo&apos;shish&quot; (Add to Home)</strong> tanlang.
              </span>
            </div>

            <div className="border-t border-border/10 pt-2 text-[10px] text-yellow-500/80 leading-normal">
              ℹ️ Agar Telegram yoki Instagram ichidagi brauzerda bo&apos;lsangiz, avval o&apos;ng tepada <strong>&quot;Safari-da ochish&quot; (Open in Safari)</strong> qiling.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
