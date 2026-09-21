import { describe, it, expect } from "vitest";
import { itemPriceUzs, orderRevenueUzs, totalRevenueUzs } from "./accounting";

describe("itemPriceUzs", () => {
  it("price_uzs mavjud bo'lsa — shuni qaytaradi", () => {
    expect(itemPriceUzs({ product_id: "p1", quantity: 1, price_uzs: 800000 })).toBe(800000);
  });

  it("price_uzs yo'q, price_at_purchase (dollar) bor bo'lsa — 12100 ga ko'paytirib qaytaradi", () => {
    expect(itemPriceUzs({ product_id: "p1", quantity: 1, price_at_purchase: 45 })).toBe(45 * 12100);
  });

  it("ikkalasi ham yo'q bo'lsa — 0 qaytaradi, NaN EMAS", () => {
    expect(itemPriceUzs({ product_id: "p1", quantity: 1 })).toBe(0);
  });

  it("price_uzs = 0 bo'lsa, price_at_purchase bo'lsa — dollardan hisoblaydi", () => {
    expect(itemPriceUzs({ product_id: "p1", quantity: 1, price_uzs: 0, price_at_purchase: 45 })).toBe(45 * 12100);
  });
});

describe("orderRevenueUzs", () => {
  it("Uzum Nasiya buyurtmasi (faqat price_uzs, price_at_purchase YO'Q) — to'g'ri hisoblaydi, NaN qaytarmaydi", () => {
    // ⚠️ Bu — Nozimaning haqiqiy buyurtmasi (2299ea1a) aynan shu shaklda edi
    // va eski kod bu yerda NaN qaytarardi.
    const order = {
      items: [
        { product_id: "f4950aea", quantity: 1, price_uzs: 800000 },
      ],
    };
    expect(orderRevenueUzs(order)).toBe(800000);
    expect(Number.isNaN(orderRevenueUzs(order))).toBe(false);
  });

  it("eski (dollar) buyurtma — price_at_purchase dan hisoblaydi", () => {
    const order = {
      items: [
        { product_id: "p1", quantity: 2, price_at_purchase: 45 },
      ],
    };
    expect(orderRevenueUzs(order)).toBe(2 * 45 * 12100);
  });

  it("items null bo'lsa — 0 qaytaradi", () => {
    expect(orderRevenueUzs({ items: null })).toBe(0);
  });

  it("bir nechta qator — yig'indini to'g'ri hisoblaydi", () => {
    const order = {
      items: [
        { product_id: "p1", quantity: 1, price_uzs: 800000 },
        { product_id: "p2", quantity: 2, price_at_purchase: 45 },
      ],
    };
    expect(orderRevenueUzs(order)).toBe(800000 + 2 * 45 * 12100);
  });
});

describe("totalRevenueUzs", () => {
  it("NaN qiluvchi buyurtma boshqalarini buzmasligi kerak", () => {
    // ⚠️ Regressiya testi: eski kodda BITTA NaN butun yig'indini
    // abadiy buzardi (5 + NaN + 10 = NaN). Bu 2026-09-18 da jonli
    // saytda "Jami Savdo" ni NaN qilib qo'ygan haqiqiy xato edi.
    const orders = [
      { items: [{ product_id: "p1", quantity: 1, price_at_purchase: 45 }] },
      { items: [{ product_id: "p2", quantity: 1, price_uzs: 800000 }] }, // Nozima kabi
      { items: [{ product_id: "p3", quantity: 1, price_at_purchase: 50 }] },
    ];
    const total = totalRevenueUzs(orders);
    expect(Number.isNaN(total)).toBe(false);
    expect(total).toBe(45 * 12100 + 800000 + 50 * 12100);
  });

  it("bo'sh ro'yxat uchun 0 qaytaradi", () => {
    expect(totalRevenueUzs([])).toBe(0);
  });
});
