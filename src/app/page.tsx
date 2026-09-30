import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { fetchCatalogProductsServer } from "@/lib/products-query.server";

/**
 * hreflang juftligi IKKI TOMONLI bo'lishi kerak: o'zbekcha sahifa ham
 * ruschaga, ruscha ham o'zbekchaga ishora qilsin. Bir tomonlama
 * ko'rsatma Google tomonidan e'tiborsiz qoldiriladi.
 */
export const metadata: Metadata = {
  alternates: {
    canonical: "https://parfumelux.uz",
    languages: {
      "uz-UZ": "https://parfumelux.uz",
      "ru-RU": "https://parfumelux.uz/ru",
      "x-default": "https://parfumelux.uz",
    },
  },
};

/**
 * Bosh sahifa statik (ISR). Soatda bir marta qayta yasaladi — vaqtga bog'liq
 * bloklar (oktyabr aksiyasi, config/promo.ts) tugagach keshlangan HTML'da
 * uzoq qolib ketmasin. Client ham aksiya muddatini o'zi tekshiradi.
 *
 * Mahsulotlar SERVERDA olinadi.
 *
 * Avval HomePage ularni `useEffect` ichida olardi, ya'ni serverdan kelgan
 * HTMLda ro'yxat bo'sh bo'lib, o'rniga "Bu bo'limda hozircha mahsulot yo'q"
 * yozuvi turardi — sitemapda 244 ta mahsulot havolasi borligiga qaramay.
 * Bu bot uchun yolg'on javob edi.
 *
 * GPTBot, ClaudeBot va PerplexityBot JavaScript ishlatmaydi, shuning uchun
 * aynan o'sha bo'sh holatni o'qirdi: AI yordamchisi "Toshkentda Dior atirini
 * bo'lib to'lab qayerdan olsam bo'ladi?" degan savolga bu saytdan iqtibos
 * olishi mumkin emas edi.
 *
 * ISR bilan birga ishlaydi: ro'yxat ham soatda bir marta yangilanadi.
 */
export const revalidate = 3600;

export default async function Page() {
  const initialProducts = await fetchCatalogProductsServer();
  return <HomePage initialProducts={initialProducts} />;
}
