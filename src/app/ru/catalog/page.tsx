import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";
import { I18nProvider } from "@/lib/i18n-context";
import { fetchCatalogProductsServer } from "@/lib/products-query.server";
import { siteConfig } from "@/config/site";

/**
 * Ruscha katalog — `/ru/catalog`.
 *
 * Mahsulotlar serverda olinadi (bot HTMLda ro'yxatni ko'rishi kerak),
 * til esa marshrutdan aniqlanadi. Izohlar uchun `src/app/ru/page.tsx`
 * ga qarang.
 */
const RU_TITLE = `Каталог духов — оригинальные и премиальные ароматы в рассрочку | ${siteConfig.siteName}`;
const RU_DESC =
  "Каталог духов в Ташкенте: Tom Ford, Dior, Chanel, Creed и другие бренды. Премиальный аромат — 800 000 сум, рассрочка на 3, 6 или 12 месяцев.";

export const metadata: Metadata = {
  title: RU_TITLE,
  description: RU_DESC,
  alternates: {
    canonical: "https://parfumelux.uz/ru/catalog",
    languages: {
      "uz-UZ": "https://parfumelux.uz/catalog",
      "ru-RU": "https://parfumelux.uz/ru/catalog",
      "x-default": "https://parfumelux.uz/catalog",
    },
  },
  openGraph: {
    title: RU_TITLE,
    description: RU_DESC,
    url: "https://parfumelux.uz/ru/catalog",
    siteName: siteConfig.siteName,
    images: [siteConfig.ogImage],
    locale: "ru_RU",
  },
};

export default async function RuCatalogPage() {
  const initialProducts = await fetchCatalogProductsServer();
  return (
    <I18nProvider initialLang="ru">
      <CatalogView initialProducts={initialProducts} />
    </I18nProvider>
  );
}
