import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { siteConfig } from "@/config/site";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { I18nProvider } from "@/lib/i18n-context";
import FloatingCart from "@/components/FloatingCart";
import MetaPixel from "@/components/MetaPixel";
import ChunkErrorRecovery from "@/components/ChunkErrorRecovery";
import UzumPendingRecovery from "@/components/UzumPendingRecovery";
import YandexMetrica from "@/components/YandexMetrica";
import SmoothScroll from "@/components/SmoothScroll";
import LuxToaster from "@/components/LuxToaster";
import "./globals.css";

// Asosiy matn — Manrope: zamonaviy, raqamlari aniq, kirill ham bor.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

// Sarlavhalar — Unbounded: yumaloq, qalin, esda qoladigan (C uslubi, 2026-09-26).
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: siteConfig.seoTitle,
  description: siteConfig.seoDescription,
  keywords: [...siteConfig.seoKeywords],
  alternates: {
    canonical: "https://parfumelux.uz/",
  },
  openGraph: {
    title: siteConfig.seoTitle,
    description: siteConfig.seoDescription,
    url: siteConfig.siteUrl,
    siteName: siteConfig.siteName,
    images: [
      {
        url: "/hero.webp",
        width: 1200,
        height: 630,
        alt: siteConfig.siteName,
      },
    ],
    locale: "uz_UZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seoTitle,
    description: siteConfig.seoDescription,
    images: ["/hero.webp"],
  },
  verification: {
    google: "3CAgz1XkqiojYhPFeqPz52IlpY03fJUlMzchSDJ8XcY",
    yandex: "a1ae49387e10bf4b",
    other: {
      "facebook-domain-verification": "jws9hd9fxfxfdbjfsrdv85jmsyhyxf",
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.siteName,
  },
};

const onlineStoreSchema = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "name": siteConfig.siteName,
  "alternateName": ["Parfume Lux", "Elore Parfume", "Parfume Lux Toshkent"],
  "url": siteConfig.siteUrl,
  "logo": `${siteConfig.siteUrl}${siteConfig.logoMark}`,
  "image": `${siteConfig.siteUrl}/hero.webp`,
  "description": siteConfig.seoDescription,
  "telephone": siteConfig.phone,
  "currenciesAccepted": "UZS",
  "paymentAccepted": "Click, Uzcard, Humo, Uzum Nasiya",
  "sameAs": [siteConfig.telegramChannel],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": siteConfig.location,
    "addressLocality": "Toshkent",
    "addressCountry": "UZ",
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${siteConfig.siteUrl}/catalog?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

import { SettingsProvider } from "@/lib/settings-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${manrope.variable} ${unbounded.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(onlineStoreSchema) }}
        />
        <SettingsProvider>
          <I18nProvider>
            <CartProvider>
            <WishlistProvider>
            <SmoothScroll />
            <ChunkErrorRecovery />
            <UzumPendingRecovery />
            <MetaPixel />
            <YandexMetrica />
            {children}
            <FloatingCart />
            <LuxToaster />
            </WishlistProvider>
          </CartProvider>
          </I18nProvider>
        </SettingsProvider>
      <img src="https://vercel-dashboard-amber-pi.vercel.app/api/track?site=parfumelux" style={{ display: "none" }} alt="" />
      </body>
    </html>
  );
}
