import { describe, it, expect } from "vitest";
import { rateLimit, clientIp } from "./rate-limit";

describe("rateLimit", () => {
  it("limitgacha ruxsat beradi, keyin rad etadi", () => {
    const k = "test-" + Math.random();
    expect(rateLimit(k, 3, 60000)).toBe(true);
    expect(rateLimit(k, 3, 60000)).toBe(true);
    expect(rateLimit(k, 3, 60000)).toBe(true);
    expect(rateLimit(k, 3, 60000)).toBe(false);
  });

  it("har bir kalit alohida hisoblanadi", () => {
    const a = "a-" + Math.random();
    const b = "b-" + Math.random();
    expect(rateLimit(a, 1, 60000)).toBe(true);
    expect(rateLimit(a, 1, 60000)).toBe(false);
    expect(rateLimit(b, 1, 60000)).toBe(true);
  });

  it("oyna o'tgach hisob tiklanadi", async () => {
    const k = "w-" + Math.random();
    expect(rateLimit(k, 1, 30)).toBe(true);
    expect(rateLimit(k, 1, 30)).toBe(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(rateLimit(k, 1, 30)).toBe(true);
  });
});

describe("clientIp", () => {
  it("x-forwarded-for dagi birinchi IP ni oladi", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(clientIp(req)).toBe("1.2.3.4");
  });

  it("header yo'q bo'lsa ham yiqilmaydi", () => {
    expect(clientIp(new Request("http://x"))).toBe("noma'lum");
  });
});
