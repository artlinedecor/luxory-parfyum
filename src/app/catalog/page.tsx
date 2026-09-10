import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Atirlar Katalogi — ${siteConfig.siteName}`,
  description:
    "Toshkentda 100% original va eng sifatli super klon atirlar to'liq katalogi. Tom Ford, Dior, Chanel, Creed va boshqa jahon brendlari.",
  alternates: {
    canonical: "https://parfumelux.uz/catalog",
  },
  openGraph: {
    title: `Atirlar Katalogi — ${siteConfig.siteName}`,
    description:
      "Toshkentda 100% original va eng sifatli super klon atirlar to'liq katalogi.",
    url: "https://parfumelux.uz/catalog",
    siteName: siteConfig.siteName,
  },
};

export default function CatalogPage() {
  return <CatalogView />;
}
