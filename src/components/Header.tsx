"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";

export default function Header() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { t, lang, setLang } = useI18n();
  const [shopName, setShopName] = useState<string>(siteConfig.siteName);
  const [logoUrl, setLogoUrl] = useState<string>("");

  useEffect(() => {
    const loadSettings = () => {
      const s = localStorage.getItem("shop_settings");
      if (s) {
        try {
          const parsed = JSON.parse(s);
          if (parsed.shopName) setShopName(parsed.shopName);
          if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
        } catch { /* ignore */ }
      }
    };
    loadSettings();
    window.addEventListener("shop_settings_updated", loadSettings);
    return () => window.removeEventListener("shop_settings_updated", loadSettings);
  }, []);

  // Don't show on dashboard routes
  if (pathname.startsWith("/dashboard")) return null;

  return (
    <header id="site-header" className="fixed top-0 left-0 right-0 z-50">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gold/10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-gold flex items-center justify-center shadow-lg shadow-gold/20 group-hover:shadow-gold/40 transition-shadow duration-300 relative">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-black font-bold text-sm">{siteConfig.logoInitial}</span>
              )}
            </div>
            <span className="font-heading text-xl font-semibold tracking-wide text-gradient-gold">
              {shopName}
            </span>
          </Link>

          {/* Desktop Nav Links — hidden on mobile (BottomNav handles it) */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={`text-sm font-medium tracking-wide transition-colors duration-300 ${
                pathname === "/" ? "text-gold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("home")}
            </Link>
            <Link
              href="/catalog"
              className={`text-sm font-medium tracking-wide transition-colors duration-300 ${
                pathname === "/catalog" ? "text-gold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("catalog")}
            </Link>
            <Link
              href="/cart"
              className={`text-sm font-medium tracking-wide transition-colors duration-300 relative ${
                pathname === "/cart" ? "text-gold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("cart")}
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-4 w-5 h-5 rounded-full bg-gradient-gold text-black text-[10px] font-bold flex items-center justify-center animate-scale-in">
                  {totalItems}
                </span>
              )}
            </Link>
          </nav>

          {/* Action Items — ALWAYS visible on all screens */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <button
                onClick={() => setLang("uz")}
                className={`px-1.5 py-0.5 rounded transition-colors ${lang === "uz" ? "text-gold bg-gold/10" : "text-muted-foreground hover:text-foreground"}`}
              >
                UZ
              </button>
              <span className="text-border">|</span>
              <button
                onClick={() => setLang("ru")}
                className={`px-1.5 py-0.5 rounded transition-colors ${lang === "ru" ? "text-gold bg-gold/10" : "text-muted-foreground hover:text-foreground"}`}
              >
                RU
              </button>
            </div>

            {/* Cart Icon (mobile-friendly) */}
            <Link
              href="/cart"
              className="relative p-2 text-muted-foreground hover:text-gold transition-colors duration-300"
              title={t("cart")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-gradient-gold text-black text-[9px] font-bold flex items-center justify-center animate-scale-in">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Ghost Login (Lock Icon) */}
            <Link
              href="/login"
              className="p-2 text-muted-foreground hover:text-gold transition-colors duration-300"
              title="Admin Panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
