import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { I18nProvider } from "@/lib/i18n-context";
import { fetchCatalogProductsServer } from "@/lib/products-query.server";
import { siteConfig } from "@/config/site";

/**
 * Ruscha bosh sahifa — `/ru`.
 *
 * NEGA ALOHIDA MARSHRUT, `?lang=ru` EMAS:
 *
 * Bosh sahifa ISR bilan keshlanadi (`revalidate = 3600`) — oktyabr
 * aksiyasi muddati tugagach keshlangan HTML uzoq qolib ketmasin degan
 * maqsadda. `searchParams` o'qilsa sahifa DINAMIK bo'lib qoladi va
 * o'sha kesh yo'qoladi. Alohida manzil esa statik qoladi.
 *
 * Qidiruv uchun ham shu to'g'ri: har til o'z manziliga ega bo'lishi
 * kerak, aks holda Google va AI botlari ikki versiyani ajrata olmaydi.
 *
 * Avvalgi holat: til faqat `localStorage` da edi, `?lang=ru` hech narsa
 * qilmasdi, `/ru` 404 berardi. Ya'ni ruscha matn umuman indekslanmagan.
 * Ruscha so'zlar faqat `keywords` meta tegida turardi, uni esa qidiruv
 * tizimlari hisobga olmaydi.
 */
export const revalidate = 3600;

const RU_TITLE = `Парфюмерия в Ташкенте — оригинальные духи в рассрочку на 3, 6 и 12 месяцев | ${siteConfig.siteName}`;
const RU_DESC =
  "Оригинальные и премиальные духи в Ташкенте: Tom Ford, Dior, Chanel, Creed и другие бренды. Премиальный аромат — 800 000 сум, рассрочка на 3, 6 или 12 месяцев. Карта не нужна: телефон и SMS, 2 минуты.";

export const metadata: Metadata = {
  title: RU_TITLE,
  description: RU_DESC,
  alternates: {
    canonical: "https://parfumelux.uz/ru",
    languages: {
      "uz-UZ": "https://parfumelux.uz",
      "ru-RU": "https://parfumelux.uz/ru",
      "x-default": "https://parfumelux.uz",
    },
  },
  openGraph: {
    title: RU_TITLE,
    description: RU_DESC,
    url: "https://parfumelux.uz/ru",
    siteName: siteConfig.siteName,
    locale: "ru_RU",
  },
};

export default async function RuHomePage() {
  const initialProducts = await fetchCatalogProductsServer();
  return (
    <I18nProvider initialLang="ru">
      <HomePage initialProducts={initialProducts} />
    </I18nProvider>
  );
}
