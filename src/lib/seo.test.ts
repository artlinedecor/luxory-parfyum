import { describe, it, expect } from "vitest";
import {
  tidyCase,
  seoProductName,
  productJsonLd,
  productMetaDescription,
  productTitle,
  TITLE_MAX,
  DESCRIPTION_MAX,
} from "./seo";
import type { Product } from "./types";

const base: Product = {
  id: "abc",
  title: "HUGO BOSS BOSS THE SCENT 100ML EDT",
  price_usd: 3.31,
  product_type: "lux_copy",
  image_url: "https://x/y.jpg",
  created_at: "2026-01-01",
  is_available: true,
};

describe("tidyCase", () => {
  it("katta harfli nomni tartiblaydi, qisqartmalarni saqlaydi", () => {
    expect(tidyCase("BOSS THE SCENT")).toBe("Boss The Scent");
    expect(tidyCase("ALEXANDRIA II")).toBe("Alexandria II");
  });
  it("aralash yozilgan nomga tegmaydi", () => {
    expect(tidyCase("eLVes")).toBe("eLVes");
  });
});

describe("mahsulot SEO", () => {
  it("toza nom: brend + nom + konsentratsiya + hajm", () => {
    expect(seoProductName(base)).toBe("Hugo Boss Boss The Scent EDT 100 ml");
  });

  it("qisqa nomlarda brend va hajm takrorlanmaydi", () => {
    expect(seoProductName({ ...base, title: "PANTHEON ROMA M 100ML" })).toBe("Pantheon Roma M 100 ml");
    expect(seoProductName({ ...base, title: "YSL Y 100ML" })).toBe("Yves Saint Laurent Y 100 ml");
  });

  it("schema narxi so'mda va savat narxi bilan bir xil (3.31 USD emas)", () => {
    const ld = productJsonLd(base);
    expect(ld.offers.priceCurrency).toBe("UZS");
    expect(ld.offers.price).toBe(800000);
    expect(ld.brand).toEqual({ "@type": "Brand", name: "Hugo Boss" });
  });

  it("original atir o'z narxi bilan", () => {
    const ld = productJsonLd({ ...base, product_type: "original", price_usd: 100 });
    expect(ld.offers.price).toBeGreaterThan(800000);
  });

  it("meta tavsifda narx va tasdiqlangan to'lov matni, taqiqlanganlar yo'q", () => {
    const d = productMetaDescription(base);
    expect(d).toContain("800 000 so'm");
    expect(d).toContain("3, 6 yoki 12 oyga");
    expect(d).not.toMatch(/0-0-6|1–3 kun|Tekshirib/);
  });

  it("sarlavha 60 belgidan oshmaydi va atir nomini saqlaydi", () => {
    const t = productTitle(base);
    expect(t.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(t).toContain("Hugo Boss Boss The Scent EDT 100 ml");
  });

  it("meta tavsif 160 belgidan oshmaydi, uzun nomda ham", () => {
    expect(productMetaDescription(base).length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    const long = productMetaDescription({
      ...base,
      title: "MAISON FRANCIS KURKDJIAN BACCARAT ROUGE 540 EXTRAIT DE PARFUM LIMITED EDITION GOLD 200ML",
    });
    expect(long.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(long.length).toBeGreaterThan(70);
  });
});
