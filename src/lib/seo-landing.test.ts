import { describe, it, expect } from "vitest";
import { slugify, groupBrands, CATEGORIES, brandFaq, faqJsonLd, getCategory } from "./seo-landing";
import { productBreadcrumbJsonLd, productMetaDescription, DESCRIPTION_MAX } from "./seo";
import type { Product } from "./types";

const mk = (title: string, extra: Partial<Product> = {}): Product => ({
  id: title,
  title,
  price_usd: 3.31,
  product_type: "lux_copy",
  image_url: null,
  created_at: "2026-01-01",
  is_available: true,
  ...extra,
});

describe("seo-landing", () => {
  it("slugify", () => {
    expect(slugify("Dolce & Gabbana")).toBe("dolce-gabbana");
    expect(slugify("Penhaligon's")).toBe("penhaligons");
    expect(slugify("Tom Ford")).toBe("tom-ford");
  });

  it("brendlar bo'yicha guruhlaydi", () => {
    const g = groupBrands([mk("TOM FORD OUD WOOD 50ML"), mk("Tom Ford Tobacco Vanille 50ml"), mk("Creed Aventus 100ml")]);
    expect(g[0].slug).toBe("tom-ford");
    expect(g[0].products).toHaveLength(2);
  });

  it("toifa slug'lari noyob va filtr ishlaydi", () => {
    expect(new Set(CATEGORIES.map((c) => c.slug)).size).toBe(CATEGORIES.length);
    expect(getCategory("erkaklar-atiri")!.match(mk("x", { gender: "male" }))).toBe(true);
    expect(getCategory("erkaklar-atiri")!.match(mk("x", { gender: "female" }))).toBe(false);
    expect(getCategory("original-atirlar")!.match(mk("x", { product_type: "original" }))).toBe(true);
  });

  it("FAQ'da taqiqlangan va'dalar yo'q, JSON-LD to'g'ri", () => {
    const all = [...CATEGORIES.flatMap((c) => c.faq), ...brandFaq("Dior")];
    for (const f of all) expect(`${f.q} ${f.a}`).not.toMatch(/klon|0-0-6|1–3 kun|Tekshirib|bepul/i);
    const ld = faqJsonLd(brandFaq("Dior"));
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(3);
  });

  it("atir sahifasi: jins tavsifga kiradi, breadcrumb'da brend bor", () => {
    const p = mk("DIOR SAUVAGE 100ML EDT", { gender: "male" });
    const d = productMetaDescription(p);
    expect(d).toContain("erkaklar uchun");
    expect(d.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    const items = productBreadcrumbJsonLd(p).itemListElement;
    expect(items).toHaveLength(4);
    expect(items[2].item).toContain("/brend/dior");
  });
});
