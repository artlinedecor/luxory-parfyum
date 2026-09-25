import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  tokenMatchesHash,
  isValidDmPayToken,
  isLinkPreviewBot,
  isAbandonedDmOrder,
  buildDmOrder,
  DM_PAY_AMOUNT_UZS,
  DM_PAY_REGION,
} from "./dm-pay-link";

// ⚠️ Repo ochiq — haqiqiy havola kodi testga yozilmaydi, faqat soxta kod.
const TEST_TOKEN = "testKod123abcXYZ";
const TEST_HASH = crypto.createHash("sha256").update(TEST_TOKEN).digest("hex");

describe("tokenMatchesHash", () => {
  it("xeshi mos kelgan kodni qabul qiladi", () => {
    expect(tokenMatchesHash(TEST_TOKEN, TEST_HASH)).toBe(true);
  });

  it("bitta harfi farq qilgan, bo'sh yoki katta-kichik harfi boshqa kodni rad etadi", () => {
    expect(tokenMatchesHash("testKod123abcXYz", TEST_HASH)).toBe(false);
    expect(tokenMatchesHash("", TEST_HASH)).toBe(false);
    expect(tokenMatchesHash("testkod123abcxyz", TEST_HASH)).toBe(false);
  });
});

describe("isValidDmPayToken", () => {
  it("tasodifiy kodlarni rad etadi", () => {
    expect(isValidDmPayToken(TEST_TOKEN)).toBe(false);
    expect(isValidDmPayToken("")).toBe(false);
    expect(isValidDmPayToken("../../etc")).toBe(false);
  });
});

describe("isLinkPreviewBot", () => {
  it("Telegram/Instagram/WhatsApp havola ko'rinishini oluvchi botlarni taniydi", () => {
    expect(isLinkPreviewBot("TelegramBot (like TwitterBot)")).toBe(true);
    expect(isLinkPreviewBot("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")).toBe(true);
    expect(isLinkPreviewBot("WhatsApp/2.23.20.0")).toBe(true);
    expect(isLinkPreviewBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
  });

  it("oddiy telefon brauzerini bot deb hisoblamaydi", () => {
    expect(
      isLinkPreviewBot(
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36"
      )
    ).toBe(false);
    expect(isLinkPreviewBot("")).toBe(false);
  });
});

describe("buildDmOrder", () => {
  it("summani server belgilaydi — 650 000 so'm, 1 ta atir, to'lanmagan", () => {
    const o = buildDmOrder();
    expect(o.total_amount).toBe(DM_PAY_AMOUNT_UZS);
    expect(DM_PAY_AMOUNT_UZS).toBe(650000);
    expect(o.items).toHaveLength(1);
    expect(o.items[0].quantity).toBe(1);
    expect(o.items[0].price_uzs).toBe(650000);
    expect(o.status).toBe("pending");
    expect(o.payment_status).toBe("unpaid");
    expect(o.region).toBe(DM_PAY_REGION);
  });

  it("fiskal chek uchun pozitsiyalar yig'indisi umumiy summaga teng", () => {
    const o = buildDmOrder();
    const sum = o.items.reduce((s, i) => s + i.price_uzs * i.quantity, 0);
    expect(sum).toBe(o.total_amount);
  });
});

describe("isAbandonedDmOrder", () => {
  it("havola ochilib, to'lanmay qolgan buyurtmani yashirish uchun aniqlaydi", () => {
    expect(isAbandonedDmOrder({ region: DM_PAY_REGION, payment_status: "unpaid" })).toBe(true);
  });

  it("to'langan/kutilayotgan DM buyurtmalarni va oddiy buyurtmalarni yashirmaydi", () => {
    expect(isAbandonedDmOrder({ region: DM_PAY_REGION, payment_status: "paid" })).toBe(false);
    expect(isAbandonedDmOrder({ region: DM_PAY_REGION, payment_status: "waiting" })).toBe(false);
    expect(isAbandonedDmOrder({ region: "Toshkent", payment_status: "unpaid" })).toBe(false);
  });
});
