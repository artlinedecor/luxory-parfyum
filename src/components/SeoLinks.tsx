import Link from "next/link";
import { CATEGORIES, categoryPath, brandPath, type BrandGroup } from "@/lib/seo-landing";
import { getFragranceView } from "@/lib/fragrance";
import { seoProductName, productTypeLabel } from "@/lib/seo";
import { slugify } from "@/lib/seo-landing";
import type { Product } from "@/lib/types";

const chip = "inline-block rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted";

/** Bosh sahifa va katalog uchun: toifalar va brendlarga ichki havolalar (server HTML). */
export function SeoLinks({ brands }: { brands: BrandGroup[] }) {
  return (
    <nav aria-label="Atir toifalari va brendlari" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-3">
      <h2 className="font-heading text-2xl text-foreground">Atirlar toifalari va brendlari</h2>
      <ul className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <li key={c.slug}><Link href={categoryPath(c.slug)} className={chip}>{c.name}</Link></li>
        ))}
        {brands.slice(0, 12).map((b) => (
          <li key={b.slug}><Link href={brandPath(b.slug)} className={chip}>{b.name} atiri</Link></li>
        ))}
        <li><Link href="/brendlar" className={chip}>Barcha brendlar</Link></li>
      </ul>
    </nav>
  );
}

const GENDER_TEXT = { male: "erkaklar uchun", female: "ayollar uchun", unisex: "erkak va ayol uchun" } as const;

/** Atir sahifasi uchun: haqiqiy ma'lumotdan yig'ilgan matn + brend/toifa havolalari. */
export function ProductSeoBlock({ product }: { product: Product }) {
  const f = getFragranceView(product);
  const parts: string[] = [
    `${seoProductName(product)} — ${product.gender ? GENDER_TEXT[product.gender] + " " : ""}${productTypeLabel(product).toLowerCase()}.`,
  ];
  if (f.brand) parts.push(`Brend: ${f.brand}.`);
  if (f.volumeMl) parts.push(`Hajmi: ${f.volumeMl} ml.`);
  if (f.notes) {
    if (f.notes.top.length) parts.push(`Yuqori notalar: ${f.notes.top.join(", ")}.`);
    if (f.notes.heart.length) parts.push(`Yurak notalari: ${f.notes.heart.join(", ")}.`);
    if (f.notes.base.length) parts.push(`Asos notalar: ${f.notes.base.join(", ")}.`);
  }
  parts.push("Toshkentga tez yetkazib berish, 3, 6 yoki 12 oyga bo'lib to'lash (Uzum Nasiya).");

  const cats = CATEGORIES.filter((c) => {
    if (c.slug === "erkaklar-atiri") return product.gender === "male";
    if (c.slug === "ayollar-atiri") return product.gender === "female";
    if (c.slug === "unisex-atirlar") return !product.gender || product.gender === "unisex";
    if (c.slug === "original-atirlar") return product.product_type === "original";
    return product.product_type !== "original";
  });

  return (
    <section className="mt-12 space-y-3 border-t border-border pt-8">
      <p className="text-sm text-muted-foreground max-w-3xl">{parts.join(" ")}</p>
      <ul className="flex flex-wrap gap-2">
        {f.brand && slugify(f.brand) && (
          <li><Link href={brandPath(slugify(f.brand))} className={chip}>{f.brand} atirlari</Link></li>
        )}
        {cats.map((c) => (
          <li key={c.slug}><Link href={categoryPath(c.slug)} className={chip}>{c.name}</Link></li>
        ))}
        <li><Link href="/catalog" className={chip}>Butun katalog</Link></li>
      </ul>
    </section>
  );
}
