"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

export default function SettingsPage() {
  const [shopName, setShopName] = useState<string>(siteConfig.siteName);
  const [shopPhone, setShopPhone] = useState<string>(siteConfig.phone);
  const [shopAddress, setShopAddress] = useState<string>(siteConfig.location);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [paymentCard, setPaymentCard] = useState<string>(siteConfig.paymentCard);
  const [paymentCardHolder, setPaymentCardHolder] = useState<string>(siteConfig.paymentCardHolder);
  const [telegramAdminUsername, setTelegramAdminUsername] = useState<string>(siteConfig.telegramAdminUsername);
  const [telegramChannel, setTelegramChannel] = useState<string>(siteConfig.telegramChannel);
  
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Load saved settings from localStorage
    const s = localStorage.getItem("shop_settings");
    if (s) {
      try {
        const parsed = JSON.parse(s);
        if (parsed.shopName) setShopName(parsed.shopName);
        if (parsed.shopPhone) setShopPhone(parsed.shopPhone);
        if (parsed.shopAddress) setShopAddress(parsed.shopAddress);
        if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
        if (parsed.paymentCard) setPaymentCard(parsed.paymentCard);
        if (parsed.paymentCardHolder) setPaymentCardHolder(parsed.paymentCardHolder);
        if (parsed.telegramAdminUsername) setTelegramAdminUsername(parsed.telegramAdminUsername);
        if (parsed.telegramChannel) setTelegramChannel(parsed.telegramChannel);
      } catch { /* ignore parse errors */ }
    }
    setMounted(true);
  }, []);

  const handleSave = () => {
    const settings = {
      shopName,
      shopPhone,
      shopAddress,
      logoUrl,
      paymentCard,
      paymentCardHolder,
      telegramAdminUsername,
      telegramChannel
    };
    localStorage.setItem("shop_settings", JSON.stringify(settings));
    setSaved(true);
    // Dispatch custom event to notify Header & Sidebar of logo/shopName updates instantly
    window.dispatchEvent(new Event("shop_settings_updated"));
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      setUploading(true);

      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setLogoUrl(data.publicUrl);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Logo yuklashda xatolik yuz berdi!');
    } finally {
      setUploading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-3xl pb-16">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">
          <span className="text-gradient-gold">Sozlamalar</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Do&apos;kon ma&apos;lumotlari, brend logotipi, to&apos;lov kartalari va Telegram aloqalarini boshqarish
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Settings Form */}
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border/40 pb-2">Do&apos;kon Brending va Logo</h2>
          
          <div className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider block">Do&apos;kon Logotipi (Logo)</label>
              <div className="flex items-center gap-4 p-3 bg-secondary/35 border border-border/40 rounded-xl">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                  {logoUrl ? (
                    <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="56px" />
                  ) : (
                    <span className="text-gold font-bold text-lg">{shopName.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-gold/10 file:text-gold hover:file:bg-gold/20 transition-all cursor-pointer w-full"
                  />
                  {uploading ? (
                    <p className="text-[10px] text-gold animate-pulse">Yuklanmoqda...</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">Kvadrat shaklidagi PNG yoki JPG mos keladi</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Do&apos;kon nomi</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Telefon raqam</label>
              <input
                type="tel"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Manzil</label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Card Details & Telegram */}
        <div className="space-y-6">
          {/* Payment Card Settings */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border/40 pb-2">To&apos;lov Karta Sozlamalari</h2>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Karta raqami</label>
                <input
                  type="text"
                  value={paymentCard}
                  onChange={(e) => setPaymentCard(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm font-mono tracking-wider text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Karta egasining ismi</label>
                <input
                  type="text"
                  value={paymentCardHolder}
                  onChange={(e) => setPaymentCardHolder(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Telegram Settings Form */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider border-b border-border/40 pb-2">Telegram Sozlamalari</h2>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Admin telegram username (lichka)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm text-muted-foreground">@</span>
                  <input
                    type="text"
                    value={telegramAdminUsername}
                    onChange={(e) => setTelegramAdminUsername(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-all"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Mijozlar buyurtmani shaxsiy telegramingizga jo&apos;natishadi (belgisiz kiriting)</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Kanal havolasi (t.me Link)</label>
                <input
                  type="text"
                  value={telegramChannel}
                  onChange={(e) => setTelegramChannel(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Save Action */}
      <button
        onClick={handleSave}
        disabled={uploading}
        className="w-full py-4 rounded-xl bg-gradient-gold text-black font-bold text-sm uppercase tracking-wider hover:opacity-90 active:scale-[0.99] transition-all shadow-lg shadow-gold/20 disabled:opacity-50"
      >
        {saved ? "✓ BARCHA SOZLAMALAR SAQLANDI!" : "Barcha o'zgarishlarni saqlash"}
      </button>
    </div>
  );
}
