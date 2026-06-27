"use client";

import React, { useState, useEffect } from "react";

export default function PwaInstallHelper() {
  const [showHelper, setShowHelper] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"android" | "ios">("android");
  const [showIosGuide, setShowIosGuide] = useState(false);

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
    if (activeTab === "ios") {
      setShowIosGuide(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowHelper(false);
      }
    } else {
      alert("Ilovani o'rnatish uchun Chrome brauzer menyusidan (o'ng tepada 3 ta nuqta) 'Ilovani o'rnatish' (Добавить на гл. экран) bandini tanlang.");
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

      {/* Text description from image */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-6 px-1">
        Lux Atir boshqaruv panelini telefoningizga yuklab oling va brauzersiz ishlating.
      </p>

      {/* Centered big button from image */}
      <button
        onClick={handleInstallClick}
        className="w-full py-3 rounded-2xl bg-gradient-gold text-black font-bold uppercase tracking-wider text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/25"
      >
        📲 O&apos;RNATISH (INSTAL)
      </button>

      {/* iOS Bouncing Arrow share guide overlay */}
      {showIosGuide && (
        <div 
          className="fixed inset-0 z-[999] bg-black/85 backdrop-blur-sm flex flex-col justify-end items-center"
          onClick={() => setShowIosGuide(false)}
        >
          <div 
            className="w-full max-w-sm bg-[#0a0a0a] border-t border-gold/30 rounded-t-3xl p-6 space-y-4 animate-slide-up relative pb-8 text-left"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowIosGuide(false)} 
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="text-center space-y-2">
              <span className="text-3xl">🍎</span>
              <h4 className="text-sm font-bold text-gradient-gold uppercase tracking-wider">iPhone-ga O&apos;rnatish</h4>
              <p className="text-[11px] text-muted-foreground text-center">
                Apple xavfsizlik qoidalari tufayli ilovani Safari orqali o&apos;rnatishingiz lozim. Quyidagi 2 ta oddiy qadamni bajaring:
              </p>
            </div>

            <div className="space-y-3 bg-secondary/30 p-4 rounded-2xl border border-border/50">
              <div className="flex items-center gap-3 text-xs text-foreground font-semibold">
                <span className="w-6 h-6 rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center justify-center font-bold text-[11px]">1</span>
                <span>Safari ostidagi <strong className="text-gold">📤 Ulashish (Share)</strong> tugmasini bosing.</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-foreground font-semibold">
                <span className="w-6 h-6 rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center justify-center font-bold text-[11px]">2</span>
                <span>Menyudan <strong className="text-gold">📲 Ekran kabi qo&apos;shish (Add to Home)</strong> bandini tanlang.</span>
              </div>
            </div>

            {/* Pulsing Arrow pointing down to Safari share button */}
            <div className="flex flex-col items-center pt-2 pb-2">
              <span className="text-[10px] text-gold uppercase tracking-widest font-extrabold animate-pulse mb-1">Tugma telefoningiz ekrani pastida joylashgan</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-6 h-6 text-gold animate-bounce">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
            
            <button 
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs uppercase tracking-wider transition-all text-center"
            >
              Tushundim
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
