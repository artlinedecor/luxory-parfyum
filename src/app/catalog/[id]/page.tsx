import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ProductDetailClient from "@/components/ProductDetailClient";
import { siteConfig } from "@/config/site";

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

    const title = `${product.title} — ${
      product.product_type === "original" ? "Original" : "Super Klon"
    } Atir | ${siteConfig.siteName}`;

    const description = product.description
      ? product.description.slice(0, 160)
      : `${product.title} premium parfyumeriyasi. Original va eng sifatli super klon atirlar hamyonbop narxlarda.`;

    const imageUrl = product.image_url || `${siteConfig.siteUrl}/products/default.png`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${siteConfig.siteUrl}/catalog/${product.id}`,
        type: "website",
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 1000,
            alt: product.title,
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

  // Schema.org / JSON-LD structured data for Google & Yandex rich snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": product.image_url || `${siteConfig.siteUrl}/products/default.png`,
    "description": product.description || `${product.title} premium parfyumeriyasi.`,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "USD",
      "price": product.price_usd,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.is_available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": `${siteConfig.siteUrl}/catalog/${product.id}`
    }
  };

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
