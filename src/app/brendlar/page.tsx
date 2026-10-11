import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { siteConfig } from "@/config/site";
import { fetchCatalogProductsServer } from "@/lib/products-query.server";
import {
  BRAND_MIN_INDEX,
  CATEGORIES,
  brandPath,
  breadcrumbJsonLd,
  categoryPath,
  groupBrands,
} from "@/lib/seo-landing";

export const revalidate = 3600;

const TITLE = `Atir brendlari — Dior, Chanel, Tom Ford va boshqalar | ${siteConfig.siteName}`;
const DESC =
  "Atir brendlari ro'yxati: har bir brendning atirlari alohida sahifada. Premium atir 800 000 so'm, 3, 6 yoki 12 oyga bo'lib to'lash. Toshkentga tez yetkazib berish.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${siteConfig.siteUrl}/brendlar` },
  openGraph: { title: TITLE, description: DESC, url: `${siteConfig.siteUrl}/brendlar`, siteName: siteConfig.siteName, images: [siteConfig.ogImage] },
};

export default async function BrandsPage() {
  const brands = groupBrands(await fetchCatalogProductsServer());
  const trail = [
    { name: "Bosh sahifa", path: "/" },
    { name: "Brendlar", path: "/brendlar" },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(trail)) }} />
      <Header />
      <main className="flex-1 pt-20 sm:pt-24 pb-24 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Bosh sahifa</Link> / <span className="text-foreground">Brendlar</span>
          </nav>
          <h1 className="font-heading text-3xl sm:text-4xl text-foreground">Atir brendlari</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
            Brendni tanlang va uning barcha atirlarini ko&apos;ring. Toshkentda onlayn buyurtma, 3, 6 yoki 12 oyga bo&apos;lib to&apos;lash (Uzum Nasiya).
          </p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {brands.filter((b) => b.products.length >= BRAND_MIN_INDEX).map((b) => (
              <li key={b.slug}>
                <Link href={brandPath(b.slug)} className="block rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
                  {b.name} atiri <span className="text-muted-foreground">({b.products.length})</span>
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="font-heading text-2xl text-foreground">Toifalar</h2>
          <ul className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={categoryPath(c.slug)} className="inline-block rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted">{c.name}</Link>
              </li>
            ))}
            <li><Link href="/catalog" className="inline-block rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted">Butun katalog</Link></li>
          </ul>
        </div>
      </main>
      <BottomNav />
      <div className="h-20 md:hidden" />
    </>
  );
}
