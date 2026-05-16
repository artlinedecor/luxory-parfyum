"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { useI18n } from "@/lib/i18n-context";

const ALLOWED_ADMIN = "mamatkuloff@bk.ru";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isLogin && email !== ALLOWED_ADMIN) {
      setErrorMsg("Xatolik: Tizimga kirish faqat bosh admin uchun ruxsat etilgan.");
      return;
    }

    setLoading(true);
    // Simulate API call for Supabase Auth
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/dashboard";
    }, 1000);
  };

  return (
    <>
      <Header />
      <main className="flex-1 pt-24 pb-24 md:pb-16 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6">
          <div className="glass-card rounded-2xl p-8 sm:p-10 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2 mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-gold flex items-center justify-center shadow-lg shadow-gold/20 mb-4 animate-float">
                <span className="text-black font-bold text-xl">{siteConfig.logoInitial}</span>
              </div>
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {isLogin ? t("login") : "Ro'yxatdan O'tish"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Do&apos;kon egalari paneli va buyurtmalarni boshqarish
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center animate-shake">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form
              id="login-form"
              className="space-y-5"
              onSubmit={handleSubmit}
            >
              {!isLogin && (
                <div className="space-y-2 animate-fade-in">
                  <label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    To&apos;liq ismingiz / Do&apos;kon nomi
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={siteConfig.siteName}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm
                             placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50
                             transition-all duration-300"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm
                           placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50
                           transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Parol
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm
                           placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50
                           transition-all duration-300"
                />
              </div>

              <button
                type="submit"
                id="login-btn"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-gold text-black font-bold text-sm uppercase tracking-wider
                         hover:opacity-90 active:scale-[0.98] transition-all duration-300
                         shadow-lg shadow-gold/25 hover:shadow-gold/40 flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  isLogin ? t("login") : "Ro'yxatdan o'tish"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">yoki</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Info */}
            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              {isLogin ? "Hali akkauntingiz yo'qmi?" : "Allaqachon akkauntingiz bormi?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMsg("");
                }}
                className="text-gold font-medium cursor-pointer hover:underline focus:outline-none"
              >
                {isLogin ? "Ro'yxatdan o'tish" : t("login")}
              </button>
            </p>
          </div>
        </div>
      </main>
      <BottomNav />
      <div className="h-20 md:hidden" />
    </>
  );
}
