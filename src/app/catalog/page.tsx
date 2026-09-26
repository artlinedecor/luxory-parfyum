import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Atirlar Katalogi — ${siteConfig.siteName}`,
  description:
    "Toshkentdagi atirlar katalogi: original va premium klon — Tom Ford, Dior, Chanel, Creed va boshqa brendlar. Premium atir 800 000 so'm, 3, 6 yoki 12 oyga bo'lib to'lash.",
  alternates: {
    canonical: "https://parfumelux.uz/catalog",
  },
  openGraph: {
    title: `Atirlar Katalogi — ${siteConfig.siteName}`,
    description:
      "Original va premium klon atirlar katalogi. 3, 6 yoki 12 oyga bo'lib to'lash.",
    url: "https://parfumelux.uz/catalog",
    siteName: siteConfig.siteName,
  },
};

export default function CatalogPage() {
  return <CatalogView />;
}
