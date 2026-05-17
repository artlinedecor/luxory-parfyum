"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site";

export default function SettingsPage() {
  const [shopName, setShopName] = useState<string>(siteConfig.siteName);
  const [shopPhone, setShopPhone] = useState<string>(siteConfig.phone);
  const [shopAddress, setShopAddress] = useState<string>(siteConfig.location);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved settings from localStorage
    const s = localStorage.getItem("shop_settings");
    if (s) {
      try {
        const parsed = JSON.parse(s);
        if (parsed.shopName) setShopName(parsed.shopName);
        if (parsed.shopPhone) setShopPhone(parsed.shopPhone);
        if (parsed.shopAddress) setShopAddress(parsed.shopAddress);
      } catch { /* ignore parse errors */ }
    }
    setMounted(true);
  }, []);

  const handleSave = () => {
    localStorage.setItem("shop_settings", JSON.stringify({ shopName, shopPhone, shopAddress }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">
          <span className="text-gradient-gold">Sozlamalar</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Do&apos;kon ma&apos;lumotlarini boshqarish
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Do&apos;kon Ma&apos;lumotlari</h2>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Do&apos;kon nomi</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
            />
            <p className="text-[10px] text-muted-foreground">Bu nom sayt sarlavhasida ko&apos;rinadi</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Telefon raqam</label>
            <input
              type="tel"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Manzil</label>
            <input
              type="text"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-xl bg-gradient-gold text-black font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-gold/20"
        >
          {saved ? "✓ Saqlandi!" : "Saqlash"}
        </button>
      </div>

      {/* Telegram Settings (read-only info) */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Telegram Integratsiya</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border/50">
            <span className="text-xs text-muted-foreground">Admin</span>
            <a href={siteConfig.telegramAdmin} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:underline">@{siteConfig.telegramAdminUsername}</a>
          </div>
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border/50">
            <span className="text-xs text-muted-foreground">Kanal</span>
            <a href={siteConfig.telegramChannel} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:underline">{siteConfig.telegramChannel.replace("https://t.me/", "@")}</a>
          </div>
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border/50">
            <span className="text-xs text-muted-foreground">Bot Notification</span>
            <span className="text-xs text-muted-foreground">.env.local da TELEGRAM_BOT_TOKEN sozlang</span>
          </div>
        </div>
      </div>

      {/* Payment Info (read-only) */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">To&apos;lov Ma&apos;lumotlari</h2>
        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border/50">
          <span className="text-xs text-muted-foreground">Karta</span>
          <span className="text-xs text-gold font-mono font-bold">{siteConfig.paymentCard}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border/50">
          <span className="text-xs text-muted-foreground">Egasi</span>
          <span className="text-xs text-foreground">{siteConfig.paymentCardHolder}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">Karta ma&apos;lumotlarini o&apos;zgartirish uchun <code className="text-gold">src/config/site.ts</code> faylini tahrirlang.</p>
      </div>
    </div>
  );
}
