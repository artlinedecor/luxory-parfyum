import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ProductDetailClient from "@/components/ProductDetailClient";
import { siteConfig } from "@/config/site";
import {
  seoProductName,
  productTypeLabel,
  productMetaDescription,
  productUrl,
  productJsonLd,
  productBreadcrumbJsonLd,
} from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

// ── DYNAMIC METADATA FOR GOOGLE & YANDEX SEO ────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (!product) {
      return {
        title: `Mahsulot topilmadi — ${siteConfig.siteName}`,
      };
    }

    const name = seoProductName(product);
    const title = `${name} — ${productTypeLabel(product)} atir, bo'lib to'lash | ${siteConfig.siteName}`;
    const description = productMetaDescription(product);
    const url = productUrl(product);

    const imageUrl = product.image_url || `${siteConfig.siteUrl}/products/default.png`;

    return {
      title,
      description,
      alternates: {
        canonical: url,
      },
      // Yashirilgan atir (takroriy yoki test) qidiruvga chiqmasin
      ...(product.is_available === false ? { robots: { index: false, follow: true } } : {}),
      openGraph: {
        title,
        description,
        url,
        type: "website",
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 1000,
            alt: name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (e) {
    console.error("Error generating metadata:", e);
    return {
      title: `${siteConfig.siteName} — Premium Parfyumeriya`,
    };
  }
}

// ── SERVER PAGE RENDERING ──────────────────────────────────────────
export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) {
    notFound();
  }

  // Schema.org / JSON-LD — narx so'mda, savat bilan bir xil manbadan (lib/seo.ts)
  const jsonLd = [productJsonLd(product), productBreadcrumbJsonLd(product)];

  return (
    <>
      {/* JSON-LD Rich Snippet for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
