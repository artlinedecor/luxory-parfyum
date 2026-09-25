import { describe, it, expect } from "vitest";
import { normalizeQuery, searchProducts, toPublicItem, buildReply, type PublicProductRow } from "./product-search";

const row = (over: Partial<PublicProductRow>): PublicProductRow => ({
  id: "id-" + Math.random().toString(36).slice(2, 8),
  title: "Atir",
  price_usd: 45,
  product_type: "lux_copy",
  stock: 1,
  ...over,
});

describe("normalizeQuery", () => {
  it("kirillni lotinga o'giradi va brend sinonimini tushunadi", () => {
    expect(normalizeQuery("Шанель Шанс")).toBe("chanel chance");
    expect(normalizeQuery("баккара")).toBe("baccarat");
    expect(normalizeQuery("диор саваж")).toBe("dior sauvage");
  });

  it("apostrof so'zni bo'lmaydi, дж — j", () => {
    expect(normalizeQuery("J'adore")).toBe("jadore");
    expect(normalizeQuery("джадор")).toBe("jadore");
  });

  it("katta harf, urg'u va belgilarni olib tashlaydi", () => {
    expect(normalizeQuery("  BACCARAT!! ")).toBe("baccarat");
    expect(normalizeQuery("Bois Impérial")).toBe("bois imperial");
  });
});

describe("searchProducts", () => {
  const baccarat = row({ title: "Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", stock: 0 });
  const baccaratExtrait = row({ title: "Baccarat Rouge 540 Extrait", brand: "Maison Francis Kurkdjian", stock: 2 });
  const sauvage = row({ title: "Sauvage", brand: "Dior", stock: 3 });
  const chance = row({ title: "Chance Eau Tendre", brand: "Chanel", title_ru: "Шанс" });
  const all = [baccarat, baccaratExtrait, sauvage, chance];

  it("mos kelmaganlar chiqmaydi", () => {
    expect(searchProducts(all, "sauvage", 5)).toEqual([sauvage]);
    expect(searchProducts(all, "tom ford", 5)).toEqual([]);
  });

  it("brend bo'yicha ham topadi (ruscha yozilsa ham)", () => {
    expect(searchProducts(all, "диор", 5)).toEqual([sauvage]);
    expect(searchProducts(all, "Шанель шанс", 5)[0]).toBe(chance);
  });

  it("teng mos kelganda omborda borlari oldin", () => {
    expect(searchProducts(all, "baccarat", 5)).toEqual([baccaratExtrait, baccarat]);
  });

  it("limit ishlaydi, bo'sh so'rov hech narsa qaytarmaydi", () => {
    expect(searchProducts(all, "baccarat", 1)).toHaveLength(1);
    expect(searchProducts(all, "   ", 5)).toEqual([]);
  });
});

describe("toPublicItem", () => {
  it("havolada utm, narx matni uzilmas probel bilan", () => {
    const item = toPublicItem(row({ id: "abc", title: "Sauvage", brand: "Dior", stock: 3 }), "https://parfumelux.uz");
    expect(item.url).toBe("https://parfumelux.uz/catalog/abc?utm_source=chatplace&utm_medium=bot");
    expect(item.price_uzs).toBe(800000);
    expect(item.price_text).toBe("800 000 so'm");
    expect(item.type).toBe("klon");
    expect(item.in_stock).toBe(true);
  });

  it("omborda yo'q — buyurtma bilan", () => {
    const item = toPublicItem(row({ stock: 0 }), "https://parfumelux.uz");
    expect(item.in_stock).toBe(false);
    expect(item.availability_text).toBe("Buyurtma bilan · 3 kungacha");
  });
});

describe("buildReply", () => {
  it("topilmasa — o'xshashini taklif qiladi", () => {
    expect(buildReply([], "tom ford")).toContain("topilmadi");
  });

  it("topilsa — nom, narx va havola bor", () => {
    const item = toPublicItem(row({ id: "abc", title: "Sauvage", brand: "Dior" }), "https://parfumelux.uz");
    const text = buildReply([item], "sauvage");
    expect(text).toContain("Dior Sauvage");
    expect(text).toContain("800 000 so'm");
    expect(text).toContain(item.url);
  });
});
