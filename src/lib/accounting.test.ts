import { describe, it, expect } from "vitest";
import { itemPriceUzs, orderRevenueUzs, totalRevenueUzs, usdToUzs, summarizeFinances } from "./accounting";

describe("itemPriceUzs", () => {
  it("price_uzs mavjud bo'lsa — shuni qaytaradi", () => {
    expect(itemPriceUzs({ product_id: "p1", quantity: 1, price_uzs: 800000 })).toBe(800000);
  });

  it("price_uzs yo'q, price_at_purchase (dollar) bor bo'lsa — 11870 ga ko'paytirib qaytaradi", () => {
    expect(itemPriceUzs({ product_id: "p1", quantity: 1, price_at_purchase: 45 })).toBe(45 * 11870);
  });

  it("ikkalasi ham yo'q bo'lsa — 0 qaytaradi, NaN EMAS", () => {
    expect(itemPriceUzs({ product_id: "p1", quantity: 1 })).toBe(0);
  });

  it("ikkalasi bo'lsa — dollar narx ustuvor (eski price_uzs 12 100 kurs bilan saqlangan)", () => {
    expect(itemPriceUzs({ product_id: "p1", quantity: 1, price_uzs: 605000, price_at_purchase: 50 })).toBe(593500);
  });

  it("price_uzs = 0 bo'lsa, price_at_purchase bo'lsa — dollardan hisoblaydi", () => {
    expect(itemPriceUzs({ product_id: "p1", quantity: 1, price_uzs: 0, price_at_purchase: 45 })).toBe(45 * 11870);
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
    expect(orderRevenueUzs(order)).toBe(2 * 45 * 11870);
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
    expect(orderRevenueUzs(order)).toBe(800000 + 2 * 45 * 11870);
  });

  it("item.quantity yo'q (undefined) bo'lsa — NaN emas, 0 sifatida hisoblanadi", () => {
    const order = {
      items: [
        { product_id: "p1", quantity: undefined as any, price_uzs: 800000 },
      ],
    };
    expect(Number.isNaN(orderRevenueUzs(order))).toBe(false);
    expect(orderRevenueUzs(order)).toBe(0);
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
    expect(total).toBe(45 * 11870 + 800000 + 50 * 11870);
  });

  it("bo'sh ro'yxat uchun 0 qaytaradi", () => {
    expect(totalRevenueUzs([])).toBe(0);
  });
});

describe("usdToUzs", () => {
  // ⚠️ cost_price_usd (COGS) va tranzaksiyalar jadvalidagi rasxod
  // yozuvlari ($ da kiritiladi) so'mdagi daromad bilan to'g'ridan-to'g'ri
  // ayirilganda Sof Foyda xato chiqadi (masshtab ~12 000x farq qiladi).
  // Bu funksiya shu ikkalasini bitta valyutaga keltiradi.
  it("dollar summasini 11870 ga ko'paytirib so'mga aylantiradi", () => {
    expect(usdToUzs(45)).toBe(45 * 11870);
  });

  it("0 uchun 0 qaytaradi", () => {
    expect(usdToUzs(0)).toBe(0);
  });

  it("noto'g'ri/undefined qiymat uchun NaN emas, 0 qaytaradi", () => {
    expect(usdToUzs(undefined as any)).toBe(0);
    expect(Number.isNaN(usdToUzs(undefined as any))).toBe(false);
  });
});

describe("summarizeFinances", () => {
  // Sarmoya va savdo SO'MDA, rasxod DOLLARDA (forma "Summa ($)"), tan narx
  // mahsulotning cost_price_usd'idan — hammasi so'mga keltirilib hisoblanadi.
  const transactions = [
    { type: "capital", amount: 12_772_120 },
    { type: "income", amount: 800_000 },
    { type: "income", amount: 544_500 },
    { type: "expense", amount: 100, expense_category: "inventory" },
    { type: "expense", amount: 20, expense_category: "operating" },
    { type: "expense", amount: 5, expense_category: null },
  ];
  const products = [
    { id: "a", stock: 2, cost_price_usd: 10 },
    { id: "b", stock: 0, cost_price_usd: 30 },
    { id: "c", stock: 1, cost_price_usd: null },
  ];
  const deliveredOrders = [
    { items: [{ product_id: "b", quantity: 1 }] },
    { items: [{ product_id: "a", quantity: 1 }] },
  ];
  const s = summarizeFinances({ transactions, deliveredOrders, products });

  it("sarmoya savdoga qo'shilmaydi, alohida turadi", () => {
    expect(s.capitalUzs).toBe(12_772_120);
    expect(s.salesUzs).toBe(1_344_500);
  });

  it("rasxodni so'mga aylantiradi va tovar xaridini operatsiondan ajratadi (kategoriyasiz = operatsion)", () => {
    expect(s.expensesUzs).toBe(125 * 11870);
    expect(s.inventoryPurchasesUzs).toBe(100 * 11870);
    expect(s.operatingExpensesUzs).toBe(25 * 11870);
  });

  it("sotilganlar tan narxi va sof foyda", () => {
    expect(s.cogsUzs).toBe(40 * 11870);
    expect(s.netProfitUzs).toBe(1_344_500 - 40 * 11870 - 25 * 11870);
  });

  it("kassa = sarmoya + savdo − barcha rasxod; savdo qoldig'i sarmoyasiz", () => {
    expect(s.cashUzs).toBe(12_772_120 + 1_344_500 - 125 * 11870);
    expect(s.salesBalanceUzs).toBe(1_344_500 - 125 * 11870);
  });

  it("ombor faqat qoldig'i bor mahsulotlardan, jami boylik va haqiqiy foyda", () => {
    expect(s.warehouseItems).toBe(3);
    expect(s.warehouseUzs).toBe(20 * 11870);
    expect(s.totalWorthUzs).toBe(s.cashUzs + s.warehouseUzs);
    expect(s.realProfitUzs).toBe(s.totalWorthUzs - s.capitalUzs);
  });

  it("sverka: hisob bo'yicha ombor (xarid − sotilgan tan narx) va haqiqiy ombor farqi", () => {
    expect(s.expectedWarehouseUzs).toBe(60 * 11870);
    expect(s.warehouseGapUzs).toBe(40 * 11870);
  });

  it("bo'sh yoki buzuq ma'lumotda NaN qaytarmaydi", () => {
    const e = summarizeFinances({
      transactions: [{ type: "income", amount: null }, { type: "expense", amount: "abc" }],
      deliveredOrders: [{ items: null }, { items: [{ product_id: "x", quantity: undefined as any }] }],
      products: [{ id: "x", stock: null, cost_price_usd: undefined }],
    });
    for (const v of Object.values(e)) expect(Number.isNaN(v)).toBe(false);
  });
});

describe("summarizeFinances — rasxod segmentlari", () => {
  const s = summarizeFinances({
    transactions: [
      { type: "expense", amount: 100, expense_category: "inventory" },
      { type: "expense", amount: 30, expense_category: "cargo" },
      { type: "expense", amount: 40, expense_category: "ads" },
      { type: "expense", amount: -10, expense_category: "ads" },
      { type: "expense", amount: 9, expense_category: "services" },
      { type: "expense", amount: 5, expense_category: "operating" },
      { type: "expense", amount: 1, expense_category: null },
    ],
    deliveredOrders: [],
    products: [],
  });

  it("har bir segmentni so'mda beradi; eski 'operating' va kategoriyasizlar 'boshqa'ga tushadi", () => {
    expect(s.expenseSegmentsUzs).toEqual({
      inventory: 100 * 11870,
      cargo: 30 * 11870,
      ads: 30 * 11870,
      services: 9 * 11870,
      deposit: 0,
      other: 6 * 11870,
    });
  });

  it("faqat atir xaridi aktiv; kargo, reklama, xizmat va boshqa — operatsion", () => {
    expect(s.inventoryPurchasesUzs).toBe(100 * 11870);
    expect(s.operatingExpensesUzs).toBe(75 * 11870);
  });

  it("segmentlar yig'indisi jami rasxodga teng", () => {
    const sum = Object.values(s.expenseSegmentsUzs).reduce((a, b) => a + b, 0);
    expect(sum).toBe(s.expensesUzs);
  });
});

describe("summarizeFinances — sarmoya aylanmasi", () => {
  it("jami boylik sarmoyadan necha barobar va savdo sarmoyani necha marta aylantirgani", () => {
    const s = summarizeFinances({
      transactions: [
        { type: "capital", amount: 1_000_000 },
        { type: "income", amount: 3_000_000 },
        { type: "expense", amount: 100, expense_category: "inventory" },
      ],
      deliveredOrders: [],
      products: [],
    });
    expect(s.salesTurnover).toBe(3);
    expect(s.worthMultiple).toBe((1_000_000 + 3_000_000 - 100 * 11870) / 1_000_000);
  });

  it("sarmoya kiritilmagan bo'lsa 0 qaytaradi, Infinity/NaN emas", () => {
    const s = summarizeFinances({ transactions: [{ type: "income", amount: 5 }], deliveredOrders: [], products: [] });
    expect(s.salesTurnover).toBe(0);
    expect(s.worthMultiple).toBe(0);
  });
});

describe("summarizeFinances — qaytadigan depozit (masalan Uzum)", () => {
  const s = summarizeFinances({
    transactions: [
      { type: "capital", amount: 1_000_000 },
      { type: "income", amount: 2_000_000 },
      { type: "expense", amount: 10, expense_category: "ads" },
      { type: "expense", amount: 100, expense_category: "deposit" },
    ],
    deliveredOrders: [],
    products: [],
  });

  it("depozit kassadan chiqadi, lekin foydani kamaytirmaydi", () => {
    expect(s.cashUzs).toBe(1_000_000 + 2_000_000 - 110 * 11870);
    expect(s.operatingExpensesUzs).toBe(10 * 11870);
    expect(s.netProfitUzs).toBe(2_000_000 - 10 * 11870);
  });

  it("depozit jami boylikka qo'shiladi (qaytib keladigan pul)", () => {
    expect(s.depositsUzs).toBe(100 * 11870);
    expect(s.totalWorthUzs).toBe(s.cashUzs + s.warehouseUzs + s.depositsUzs);
    expect(s.realProfitUzs).toBe(2_000_000 - 10 * 11870);
  });
});
