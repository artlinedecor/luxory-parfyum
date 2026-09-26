import { describe, it, expect } from "vitest";
import { normalizeQuery, searchProducts, findShortLinkProduct, toPublicItem, buildReply, type PublicProductRow } from "./product-search";

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

  it("yangi atirlarning ruscha va xato yozilishi", () => {
    expect(normalizeQuery("tyger")).toBe("tygar");
    expect(normalizeQuery("Булгари Тайгар")).toBe("bulgari tygar");
    expect(normalizeQuery("Мисс Диор")).toBe("miss dior");
    expect(normalizeQuery("Инвиктус")).toBe("invictus");
    expect(normalizeQuery("Версаче Эрос")).toBe("versace eros");
    expect(normalizeQuery("Шанель Аллюр")).toBe("chanel allure");
    expect(normalizeQuery("Блэк Опиум")).toBe("black opium");
    expect(normalizeQuery("Жан Поль Готье Скандал")).toBe("jean paul gaultier scandal");
    expect(normalizeQuery("Хачиват")).toBe("hacivat");
    expect(normalizeQuery("Том Форд Табако Ваниль")).toBe("tom ford tobacco vanil");
    expect(normalizeQuery("Гуд Герл")).toBe("good girl");
    expect(normalizeQuery("Лэйтон")).toBe("layton");
  });

  it("Bleu va Blue bir xil, Eau de Parfum — edp", () => {
    expect(normalizeQuery("Блю де Шанель")).toBe("blue de chanel");
    expect(normalizeQuery("Bleu de Chanel Eau de Parfum")).toBe("blue de chanel edp");
    expect(normalizeQuery("Туалетная вода")).toBe("edt");
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

describe("findShortLinkProduct", () => {
  const sauvage = row({ title: "DIOR SAUVAGE ELIXIR 60 ml" });
  const imagination = row({ title: "Louis Vuitton Imagination Eau De Parfum 100 ml" });
  const ombre = row({ title: "Louis Vuitton Ombre Nomade Eau De Parfum" });
  const all = [sauvage, imagination, ombre];

  it("defisli nomdan aniq atirni topadi", () => {
    expect(findShortLinkProduct(all, "dior-sauvage-elixir")).toBe(sauvage);
    expect(findShortLinkProduct(all, "louis-vuitton-imagination")).toBe(imagination);
  });

  it("qisqartma yoki kirill bilan yozilsa ham topadi", () => {
    expect(findShortLinkProduct(all, "lv-imagination")).toBe(imagination);
    expect(findShortLinkProduct(all, "диор-саваж")).toBe(sauvage);
  });

  it("bir xil mos kelganda ortiqcha so'zi kami tanlanadi", () => {
    const hedonist = row({ title: "EX NIHILO THE HEDONIST 100ML" });
    const extrait = row({ title: "Ex Nihilo The Hedonist Extrait de Parfum 100ml" });
    expect(findShortLinkProduct([extrait, hedonist], "ex-nihilo-the-hedonist")).toBe(hedonist);
  });

  it("ruscha nom va hajm tanlovga ta'sir qilmaydi: Allure — Allure, Homme — Homme", () => {
    const sport = row({ title: "CHANEL ALLURE HOMME SPORT 100ML" });
    const allure = row({ title: "Chanel Allure Eau de Parfum 100 ml", title_ru: "Chanel Allure Парфюмерная вода 100 мл" });
    const homme = row({ title: "Chanel Allure Homme Eau de Toilette 100 ml", title_ru: "Chanel Allure Homme Туалетная вода 100 мл" });
    const list = [sport, allure, homme];
    expect(findShortLinkProduct(list, "chanel-allure")).toBe(allure);
    expect(findShortLinkProduct(list, "chanel-allure-homme")).toBe(homme);
    expect(findShortLinkProduct(list, "chanel-allure-homme-sport")).toBe(sport);
  });

  it("EDP va Parfum ajratiladi", () => {
    const parfum = row({ title: "BLEU DE CHANEL PARFUM" });
    const edp = row({ title: "Chanel Bleu de Chanel Eau de Parfum 100 ml", title_ru: "Bleu de Chanel Парфюмерная вода 100 мл" });
    expect(findShortLinkProduct([parfum, edp], "bleu-de-chanel-edp")).toBe(edp);
    const elixir = row({ title: "DIOR SAUVAGE ELIXIR 60 ml" });
    const sauvage = row({ title: "Dior Sauvage Eau de Parfum 100 ml" });
    expect(findShortLinkProduct([elixir, sauvage], "dior-sauvage-edp")).toBe(sauvage);
    expect(findShortLinkProduct([sauvage, elixir], "dior-sauvage-elixir")).toBe(elixir);
  });

  it("faqat brend mos kelsa — null, boshqa atirga olib bormaydi", () => {
    const rose = row({ title: "TOM FORD ROSE D'AMALFI 100ML" });
    expect(findShortLinkProduct([rose], "tom-ford-tobacco-vanille")).toBeNull();
    expect(findShortLinkProduct([row({ title: "BULGARI POUR HOMME 100ML" })], "bvlgari-tygar")).toBeNull();
  });

  it("brend mos, atir nomi boshqa — null", () => {
    const acqua = row({ title: "GIORGIO ARMANI ACQUA DI GIO 100ML" });
    const splendide = row({ title: "CHANEL CHANCE EAU SPLENDIDE" });
    expect(findShortLinkProduct([acqua], "giorgio-armani-si")).toBeNull();
    expect(findShortLinkProduct([splendide], "chanel-chance-eau-tendre")).toBeNull();
    expect(findShortLinkProduct([splendide], "chanel-chance")).toBe(splendide);
    expect(findShortLinkProduct([sauvage], "dior-homme-intense")).toBeNull();
  });

  it("umumiy so'zlar (eau de parfum, 100ml emas) xalaqit bermaydi, №5 tushuniladi", () => {
    expect(findShortLinkProduct(all, "lv-imagination-eau-de-parfum")).toBe(imagination);
    const n5 = row({ title: "CHANEL №5 100ML" });
    expect(findShortLinkProduct([n5], "chanel-no5")).toBe(n5);
  });

  it("so'zlarning 60% idan kami mos kelsa — null (noto'g'ri atirga olib bormaydi)", () => {
    expect(findShortLinkProduct(all, "chanel-coco-noir")).toBeNull();
    expect(findShortLinkProduct(all, "louis-vuitton-pacific-chill-cologne")).toBeNull();
    expect(findShortLinkProduct(all, "---")).toBeNull();
  });
});
