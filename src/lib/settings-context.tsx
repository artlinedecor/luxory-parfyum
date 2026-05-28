"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { siteConfig } from "@/config/site";

interface ShopSettings {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  logoUrl: string;
  paymentCard: string;
  paymentCardHolder: string;
  telegramAdminUsername: string;
  telegramChannel: string;
}

const defaultSettings: ShopSettings = {
  shopName: siteConfig.siteName,
  shopPhone: siteConfig.phone,
  shopAddress: siteConfig.location,
  logoUrl: "",
  paymentCard: siteConfig.paymentCard,
  paymentCardHolder: siteConfig.paymentCardHolder,
  telegramAdminUsername: siteConfig.telegramAdminUsername,
  telegramChannel: siteConfig.telegramChannel,
};

const SettingsContext = createContext<ShopSettings>(defaultSettings);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadSettings = () => {
      const s = localStorage.getItem("shop_settings");
      if (s) {
        try {
          const parsed = JSON.parse(s);
          
          if (parsed.telegramAdminUsername && !parsed.telegramAdminUsername.startsWith("http")) {
            parsed.telegramAdminUsername = `https://t.me/${parsed.telegramAdminUsername.replace("@", "")}`;
          }

          setSettings((prev) => ({ ...prev, ...parsed }));
        } catch {
          // ignore
        }
      }
    };

    loadSettings();
    window.addEventListener("shop_settings_updated", loadSettings);
    return () => window.removeEventListener("shop_settings_updated", loadSettings);
  }, []);

  // Avoid hydration mismatch by rendering default on server, but we need to render children always
  // So we just return the settings. It might cause a small flicker if shopName is heavily used in initial render,
  // but it's better than hardcoding.
  return (
    <SettingsContext.Provider value={mounted ? settings : defaultSettings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useShopSettings() {
  return useContext(SettingsContext);
}
