import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoLanding from "@/components/SeoLanding";
import { siteConfig } from "@/config/site";
import { fetchCatalogProductsServer } from "@/lib/products-query.server";
import {
  BRAND_MIN_INDEX,
  brandDescription,
  brandFaq,
  brandIntro,
  brandPath,
  brandTitle,
  breadcrumbJsonLd,
  groupBrands,
  itemListJsonLd,
} from "@/lib/seo-landing";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function findBrand(slug: string) {
  const all = await fetchCatalogProductsServer();
  const brands = groupBrands(all);
  return { brands, brand: brands.find((b) => b.slug === slug) };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { brand } = await findBrand(slug);
  if (!brand) return { title: `Sahifa topilmadi — ${siteConfig.siteName}` };
  const url = `${siteConfig.siteUrl}${brandPath(slug)}`;
  const title = brandTitle(brand.name);
  const description = brandDescription(brand.name, brand.products.length);
  return {
    title,
    description,
    alternates: { canonical: url },
    // Bitta atirli brend sahifasi yupqa: indekslanmaydi, lekin havolalar kuzatiladi
    ...(brand.products.length < BRAND_MIN_INDEX ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url, siteName: siteConfig.siteName, images: [siteConfig.ogImage] },
  };
}

export default async function BrandPage({ params }: PageProps) {
  const { slug } = await params;
  const { brands, brand } = await findBrand(slug);
  if (!brand) notFound();

  const path = brandPath(slug);
  const h1 = `${brand.name} atiri — Toshkentda`;
  const trail = [
    { name: "Bosh sahifa", path: "/" },
    { name: "Brendlar", path: "/brendlar" },
    { name: `${brand.name} atiri`, path },
  ];

  return (
    <SeoLanding
      h1={h1}
      intro={brandIntro(brand.name, brand.products.length)}
      trail={trail}
      products={brand.products}
      faq={brandFaq(brand.name)}
      jsonLd={[breadcrumbJsonLd(trail), itemListJsonLd(h1, path, brand.products)]}
      topBrands={brands.filter((b) => b.slug !== slug).slice(0, 8)}
    />
  );
}
