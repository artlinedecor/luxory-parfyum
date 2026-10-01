import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";
import { fetchCatalogProductsServer } from "@/lib/products-query.server";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Atirlar Katalogi — ${siteConfig.siteName}`,
  description:
    "Toshkentdagi atirlar katalogi: original va premium atirlar — Tom Ford, Dior, Chanel, Creed va boshqa brendlar. Premium atir 800 000 so'm, 3, 6 yoki 12 oyga bo'lib to'lash.",
  alternates: {
    canonical: "https://parfumelux.uz/catalog",
    // hreflang juftligi ikki tomonli: /ru/catalog ham bu yerga ishora qiladi
    languages: {
      "uz-UZ": "https://parfumelux.uz/catalog",
      "ru-RU": "https://parfumelux.uz/ru/catalog",
      "x-default": "https://parfumelux.uz/catalog",
    },
  },
  openGraph: {
    title: `Atirlar Katalogi — ${siteConfig.siteName}`,
    description:
      "Original va premium atirlar katalogi. 3, 6 yoki 12 oyga bo'lib to'lash.",
    url: "https://parfumelux.uz/catalog",
    siteName: siteConfig.siteName,
    images: [siteConfig.ogImage],
  },
};

/**
 * Mahsulotlar SERVERDA olinadi va CatalogView ga berilaadi.
 *
 * Avval CatalogView o'zi `useEffect` da olardi, ya'ni serverdan kelgan
 * HTMLda ro'yxat bo'sh bo'lib, "Bu bo'limda hozircha mahsulot yo'q"
 * yozuvi turardi. Bot uchun bu yolg'on javob edi.
 */
export default async function CatalogPage() {
  const initialProducts = await fetchCatalogProductsServer();
  return <CatalogView initialProducts={initialProducts} />;
}
