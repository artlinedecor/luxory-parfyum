"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { useI18n } from "@/lib/i18n-context";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const resData = await response.json();
      if (!response.ok) {
        setErrorMsg(resData.message || "Xatolik yuz berdi!");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Tizimga kirishda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 pt-24 pb-24 md:pb-16 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6">
          <div className="glass-card p-8 sm:p-10 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2 mb-8">
              <div className="w-14 h-14 mx-auto border border-gold flex items-center justify-center mb-5">
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
              <div className="p-3.5 mb-4 bg-destructive/8 border border-destructive/25 text-destructive text-xs text-center">
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
                    className="w-full px-4 min-h-[48px] py-3 bg-transparent border border-input text-foreground text-sm
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
                  className="w-full px-4 min-h-[48px] py-3 bg-transparent border border-input text-foreground text-sm
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
                  className="w-full px-4 min-h-[48px] py-3 bg-transparent border border-input text-foreground text-sm
                           placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50
                           transition-all duration-300"
                />
              </div>

              <button
                type="submit"
                id="login-btn"
                disabled={loading}
                className="w-full min-h-[52px] py-3.5 bg-foreground text-background text-[11px] uppercase tracking-[0.16em] font-semibold
                         hover:opacity-90 active:scale-[0.98] transition-all duration-300
                         shadow-lg shadow-gold/25 hover:shadow-gold/40 flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-4 h-4 border border-background/30 border-t-background rounded-full animate-spin" />
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
                className="text-gold-deep font-medium cursor-pointer hover:underline underline-offset-4 focus:outline-none"
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
