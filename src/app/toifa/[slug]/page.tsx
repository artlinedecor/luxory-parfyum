import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoLanding from "@/components/SeoLanding";
import { siteConfig } from "@/config/site";
import { fetchCatalogProductsServer } from "@/lib/products-query.server";
import {
  getCategory,
  categoryPath,
  groupBrands,
  breadcrumbJsonLd,
  itemListJsonLd,
} from "@/lib/seo-landing";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) return { title: `Sahifa topilmadi — ${siteConfig.siteName}` };
  const url = `${siteConfig.siteUrl}${categoryPath(slug)}`;
  return {
    title: cat.title,
    description: cat.description,
    alternates: { canonical: url },
    openGraph: {
      title: cat.title,
      description: cat.description,
      url,
      siteName: siteConfig.siteName,
      images: [siteConfig.ogImage],
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) notFound();

  const all = await fetchCatalogProductsServer();
  const products = all.filter(cat.match);
  const path = categoryPath(slug);
  const trail = [
    { name: "Bosh sahifa", path: "/" },
    { name: "Katalog", path: "/catalog" },
    { name: cat.name, path },
  ];

  return (
    <SeoLanding
      h1={cat.name}
      intro={cat.intro}
      trail={trail}
      products={products}
      faq={cat.faq}
      jsonLd={[breadcrumbJsonLd(trail), itemListJsonLd(cat.name, path, products)]}
      topBrands={groupBrands(all).slice(0, 8)}
      currentCategory={slug}
    />
  );
}
