"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";
import { useShopSettings } from "@/lib/settings-context";
import BrandLogo from "@/components/BrandLogo";

export default function Header() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { t, lang, setLang } = useI18n();
  const { shopName } = useShopSettings();

  // Dashboard sahifalarida ko'rsatilmaydi
  if (pathname.startsWith("/dashboard")) return null;

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`relative text-[11px] uppercase tracking-[0.16em] transition-colors duration-300 ${
        pathname === href
          ? "text-foreground after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-px after:bg-gold"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header id="site-header" className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-background/85 backdrop-blur-xl border-b border-border" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex min-h-[44px] items-center gap-2.5 group"
            aria-label={shopName}
          >
            <BrandLogo />
          </Link>

          {/* Kompyuterdagi menyu (telefonda BottomNav ishlaydi) */}
          <nav className="hidden md:flex items-center gap-9">
            {navLink("/", t("home"))}
            {navLink("/catalog", t("catalog"))}
            {navLink("/cart", t("cart"))}
          </nav>

          {/* O'ng tomon — har doim ko'rinadi */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Til almashtirish */}
            <div className="flex items-center text-[11px] tracking-[0.12em]">
              {(["uz", "ru"] as const).map((code, i) => (
                <span key={code} className="flex items-center">
                  {i > 0 && <span className="text-muted-foreground/40">/</span>}
                  <button
                    onClick={() => setLang(code)}
                    aria-pressed={lang === code}
                    /* px/py — barmoq uchun 44px nishon (ko'rinishi o'zgarmaydi) */
                    className={`px-1.5 py-3.5 -my-3.5 transition-colors ${
                      lang === code
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {code.toUpperCase()}
                  </button>
                </span>
              ))}
            </div>

            {/* Savatcha */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center w-11 h-11 -mr-2.5 text-muted-foreground hover:text-foreground transition-colors duration-300"
              title={t("cart")}
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.25} />
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-1 min-w-[16px] h-4 px-1 rounded-full bg-foreground text-background text-[9px] font-semibold flex items-center justify-center animate-scale-in">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Admin kirish */}
            <Link
              href="/login"
              className="flex items-center justify-center w-11 h-11 -mr-3 text-muted-foreground/60 hover:text-foreground transition-colors duration-300"
              title="Admin Panel"
            >
              <Lock className="w-4 h-4" strokeWidth={1.25} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
