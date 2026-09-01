import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
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

// Asosiy matn shrifti — narx, hajm, filtr, tugma, tavsif.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Plus Jakarta Sans da kirill harflari YO'Q — ruscha matn uchun Inter
// zaxira sifatida turadi (brauzer har bir harf uchun avtomatik tanlaydi).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Sarlavhalar, brend nomlari, bannerlar — nafis serif.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: siteConfig.seoTitle,
  description: siteConfig.seoDescription,
  keywords: [...siteConfig.seoKeywords],
  openGraph: {
    title: siteConfig.seoTitle,
    description: siteConfig.seoDescription,
    type: "website",
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

import { SettingsProvider } from "@/lib/settings-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${jakarta.variable} ${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
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
      <img src="https://vercel-dashboard-amber-pi.vercel.app/api/track?site=parfumelux" style={"display":"none"} alt="" />
      </body>
    </html>
  );
}
