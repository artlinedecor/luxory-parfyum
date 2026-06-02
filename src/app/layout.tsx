import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { siteConfig } from "@/config/site";
import { CartProvider } from "@/lib/cart-context";
import { I18nProvider } from "@/lib/i18n-context";
import FloatingCart from "@/components/FloatingCart";
import MetaPixel from "@/components/MetaPixel";
import YandexMetrica from "@/components/YandexMetrica";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
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
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SettingsProvider>
          <I18nProvider>
            <CartProvider>
            <MetaPixel />
            <YandexMetrica />
            {children}
            <FloatingCart />
          </CartProvider>
          </I18nProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
