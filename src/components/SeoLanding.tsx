import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES, categoryPath, brandPath, faqJsonLd, type BrandGroup, type FaqItem } from "@/lib/seo-landing";
import type { Product } from "@/lib/types";

/**
 * Toifa va brend sahifalari uchun umumiy qobiq (server komponent).
 * Matn, FAQ va havolalar serverdan HTML sifatida keladi — botlar JS'siz ham o'qiydi.
 */
export default function SeoLanding({
  h1,
  intro,
  trail,
  products,
  faq,
  jsonLd,
  topBrands,
  currentCategory,
}: {
  h1: string;
  intro: string[];
  trail: { name: string; path: string }[];
  products: Product[];
  faq: FaqItem[];
  jsonLd: object[];
  topBrands: BrandGroup[];
  currentCategory?: string;
}) {
  const ld = [...jsonLd, ...(faq.length ? [faqJsonLd(faq)] : [])];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Header />
      <main className="flex-1 pt-20 sm:pt-24 pb-24 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
              {trail.map((t, i) => (
                <li key={t.path} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden="true">/</span>}
                  {i < trail.length - 1 ? (
                    <Link href={t.path} className="hover:text-foreground">{t.name}</Link>
                  ) : (
                    <span aria-current="page" className="text-foreground">{t.name}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <section className="space-y-3">
            <h1 className="font-heading text-3xl sm:text-4xl text-foreground">{h1}</h1>
            {intro.map((p) => (
              <p key={p} className="text-sm sm:text-base text-muted-foreground max-w-3xl">{p}</p>
            ))}
          </section>

          <section aria-label={h1}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
          </section>

          {faq.length > 0 && (
            <section className="space-y-3 max-w-3xl">
              <h2 className="font-heading text-2xl text-foreground">Ko&apos;p so&apos;raladigan savollar</h2>
              {faq.map((f) => (
                <details key={f.q} className="border-b border-border py-3">
                  <summary className="cursor-pointer text-sm font-medium text-foreground">{f.q}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </section>
          )}

          <nav aria-label="Boshqa bo'limlar" className="space-y-3">
            <h2 className="font-heading text-2xl text-foreground">Boshqa atirlar</h2>
            <ul className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => c.slug !== currentCategory).map((c) => (
                <li key={c.slug}>
                  <Link href={categoryPath(c.slug)} className="inline-block rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted">{c.name}</Link>
                </li>
              ))}
              {topBrands.map((b) => (
                <li key={b.slug}>
                  <Link href={brandPath(b.slug)} className="inline-block rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted">{b.name} atiri</Link>
                </li>
              ))}
              <li>
                <Link href="/brendlar" className="inline-block rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted">Barcha brendlar</Link>
              </li>
              <li>
                <Link href="/catalog" className="inline-block rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted">Butun katalog</Link>
              </li>
            </ul>
          </nav>
        </div>
      </main>
      <BottomNav />
      <div className="h-20 md:hidden" />
    </>
  );
}
