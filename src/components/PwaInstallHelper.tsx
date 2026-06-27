"use client";

import React, { useState, useEffect } from "react";

export default function PwaInstallHelper() {
  const [showHelper, setShowHelper] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"android" | "ios">("android");

  useEffect(() => {
    // Check if already in standalone mode (already installed)
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
      setShowHelper(true);
    }

    // Capture Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setActiveTab("android");
      setShowHelper(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Fallback detection: if it is a mobile device and PWA can be installed
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && !isStandalone) {
      setShowHelper(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowHelper(false);
    }
  };

  if (!showHelper) return null;

  return (
    <div className="glass-card rounded-2xl p-5 border border-gold/20 shadow-xl max-w-sm mx-auto my-4 bg-[#0a0a0a]/90 backdrop-blur-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-gold/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          📱 Mobil Ilova O&apos;rnatish
        </h3>
        <button 
          onClick={() => setShowHelper(false)} 
          className="text-muted-foreground hover:text-foreground text-xs p-1"
          title="Yopish"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 mb-4 bg-secondary/30 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("android")}
          className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === "android"
              ? "bg-gradient-gold text-black shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Android / Chrome
        </button>
        <button
          onClick={() => setActiveTab("ios")}
          className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === "ios"
              ? "bg-gradient-gold text-black shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          iPhone / iOS
        </button>
      </div>

      {activeTab === "android" ? (
        <div className="space-y-3">
          {deferredPrompt ? (
            <>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Lux Atir boshqaruv panelini telefoningizga yuklab oling va brauzersiz ishlating.
              </p>
              <button
                onClick={handleInstallClick}
                className="w-full py-2.5 rounded-xl bg-gradient-gold text-black font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/20"
              >
                📥 O&apos;rnatish (Instal)
              </button>
            </>
          ) : (
            <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>Chrome brauzerida ilovani o&apos;rnatish uchun:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Brauzer menyusini oching (o&apos;ng burchakdagi 3 ta nuqta).</li>
                <li><strong>&quot;Ilovani o&apos;rnatish&quot;</strong> (Добавить на гл. экран) tanlang.</li>
              </ol>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground space-y-3 leading-relaxed">
          <p>Safari brauzerida ilovani o&apos;rnatish uchun:</p>
          <div className="bg-secondary/20 p-3 rounded-lg border border-border/50 space-y-2">
            <div className="flex items-start gap-2">
              <span className="bg-gold/20 text-gold w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] mt-0.5">1</span>
              <span>Safari pastidagi <strong>&quot;Ulashish&quot; (Share)</strong> 📤 tugmasini bosing.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-gold/20 text-gold w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] mt-0.5">2</span>
              <span>Menudan <strong>&quot;Ekran kabi qo&apos;shish&quot; (Add to Home Screen)</strong> 📲 tanlang.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
