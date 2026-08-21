import { describe, it, expect } from "vitest";
import { priceOfProductUzs, buildOrderLines, type DbProduct } from "./pricing-server";

const PREMIUM: DbProduct = {
  id: "p1", title: "Lux atir", price_usd: 25, product_type: "lux_copy",
};
const ORIGINAL: DbProduct = {
  id: "p2", title: "Original atir", price_usd: 100, product_type: "original",
};

describe("priceOfProductUzs", () => {
  it("premium atir uchun 800 000 so'm", () => {
    expect(priceOfProductUzs(PREMIUM)).toBe(800000);
  });

  it("original atir uchun (narx + 100) * 12100", () => {
    expect(priceOfProductUzs(ORIGINAL)).toBe(200 * 12100);
  });

  it("0.01 test narxi ikkala turda ham 1000 so'm", () => {
    expect(priceOfProductUzs({ ...PREMIUM, price_usd: 0.01 })).toBe(1000);
    expect(priceOfProductUzs({ ...ORIGINAL, price_usd: 0.01 })).toBe(1000);
  });
});

describe("buildOrderLines", () => {
  const byId = new Map([[PREMIUM.id, PREMIUM], [ORIGINAL.id, ORIGINAL]]);

  it("mijoz yuborgan narxni E'TIBORSIZ qoldiradi", () => {
    // Hujum: DevTools'dan 1000 so'm yozib yuborish
    const { lines, totalUzs } = buildOrderLines(
      [{ product_id: "p1", quantity: 1, price_uzs: 1000, price: 1000 } as never],
      byId
    );
    expect(lines[0].price_uzs).toBe(800000);
    expect(totalUzs).toBe(800000);
  });

  it("miqdorni ham mijozdan olmasdan normallashtiradi", () => {
    const { totalUzs } = buildOrderLines(
      [{ product_id: "p1", quantity: 0 }, { product_id: "p1", quantity: -5 }],
      byId
    );
    expect(totalUzs).toBe(1600000); // ikkalasi ham 1 dona
  });

  it("kasr miqdorni pastga yaxlitlaydi", () => {
    const { lines } = buildOrderLines([{ product_id: "p1", quantity: 2.9 }], byId);
    expect(lines[0].quantity).toBe(2);
  });

  it("bir nechta mahsulot yig'indisini to'g'ri hisoblaydi", () => {
    const { totalUzs } = buildOrderLines(
      [{ product_id: "p1", quantity: 2 }, { product_id: "p2", quantity: 1 }],
      byId
    );
    expect(totalUzs).toBe(2 * 800000 + 2420000);
  });

  it("bazada yo'q mahsulot uchun xato tashlaydi", () => {
    expect(() => buildOrderLines([{ product_id: "yoq", quantity: 1 }], byId))
      .toThrow(/topilmadi/);
  });

  it("bo'sh savat uchun xato tashlaydi", () => {
    expect(() => buildOrderLines([], byId)).toThrow(/bo'sh/);
  });

  it("qatorlarda mahsulot nomi bazadan olinadi", () => {
    const { lines } = buildOrderLines(
      [{ product_id: "p1", quantity: 1, title: "SOXTA NOM" } as never],
      byId
    );
    expect(lines[0].title).toBe("Lux atir");
  });
});
