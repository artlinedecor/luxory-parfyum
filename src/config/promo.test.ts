import { describe, expect, it } from "vitest";
import {
  PROMO,
  isPromoActive,
  msToNextMinuteTick,
  promoDaysLeft,
  promoMinutesLeft,
  splitMinutes,
  promoEndLabel,
  promoOldPriceFor,
} from "./promo";

const END = Date.parse(PROMO.endsAt);

describe("oktyabr aksiyasi", () => {
  it("chegirma foizi narxlarga mos: 1 000 000 − 20% = 800 000", () => {
    expect(PROMO.oldPriceUzs * (1 - PROMO.percent / 100)).toBe(PROMO.priceUzs);
  });

  it("endsAt gacha faol, bir soniya o'tgach nofaol", () => {
    expect(isPromoActive(Date.parse("2026-09-27T12:00:00+05:00"))).toBe(true);
    expect(isPromoActive(END)).toBe(true);
    expect(isPromoActive(END + 1000)).toBe(false);
  });

  it("active: false bo'lsa muddatidan oldin ham o'chadi", () => {
    expect(isPromoActive(END - 1000, { ...PROMO, active: false })).toBe(false);
  });

  it("eski narx faqat 800 000 lik atirga, faqat aksiya vaqtida", () => {
    const on = isPromoActive(END - 1000);
    expect(promoOldPriceFor(800_000, on)).toBe(1_000_000);
    expect(promoOldPriceFor(2_420_000, on)).toBeNull(); // original atir
    expect(promoOldPriceFor(1000, on)).toBeNull(); // test narx
    expect(promoOldPriceFor(800_000, isPromoActive(END + 1000))).toBeNull();
  });

  it("qolgan kunlar Toshkent vaqtida: oxirgi kuni 1, tugagach 0", () => {
    expect(promoDaysLeft(Date.parse("2026-10-31T00:00:01+05:00"))).toBe(1);
    expect(promoDaysLeft(Date.parse("2026-10-30T23:59:00+05:00"))).toBe(2);
    expect(promoDaysLeft(Date.parse("2026-09-27T10:00:00+05:00"))).toBe(35);
    expect(promoDaysLeft(END + 1000)).toBe(0);
  });

  it("countdown: kun · soat · daqiqa, yuqoriga yaxlitlangan", () => {
    // 27-sentabr 10:00 → 31-oktabr 23:59:59: 34 kun 13:59:59 → 34 kun 14 soat 00 daq
    const m = promoMinutesLeft(Date.parse("2026-09-27T10:00:00+05:00"));
    expect(m).toBe(34 * 1440 + 14 * 60);
    expect(splitMinutes(m!)).toEqual({ days: 34, hours: 14, minutes: 0 });
    expect(splitMinutes(promoMinutesLeft(Date.parse("2026-10-31T22:58:30+05:00"))!)).toEqual({
      days: 0,
      hours: 1,
      minutes: 2,
    });
  });

  it("countdown: oxirgi soniyalarda 1 daqiqa, tugagach null", () => {
    expect(promoMinutesLeft(END - 30_000)).toBe(1);
    expect(promoMinutesLeft(END)).toBe(0);
    expect(promoMinutesLeft(END + 1000)).toBeNull();
    expect(promoMinutesLeft(END - 60_000, { ...PROMO, active: false })).toBeNull();
    expect(splitMinutes(-5)).toEqual({ days: 0, hours: 0, minutes: 0 });
  });

  it("countdown taymeri keyingi daqiqa almashuviga tekislanadi", () => {
    expect(msToNextMinuteTick(END - 90_000)).toBe(30_000);
    expect(msToNextMinuteTick(END - 120_000)).toBe(60_000);
    expect(msToNextMinuteTick(END + 5)).toBe(60_000);
  });

  it("tugash sanasi matni", () => {
    expect(promoEndLabel("uz")).toBe("31-oktyabrgacha");
    expect(promoEndLabel("ru")).toBe("до 31 октября");
  });
});
