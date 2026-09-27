import { describe, it, expect } from "vitest";
import { mergeMissing, removeMissing, normalizeMissingSlug } from "./missing-perfumes";

describe("missing-perfumes", () => {
  it("yangi atir qo'shiladi, takror so'ralsa sanog'i oshadi", () => {
    let l = mergeMissing([], "Creed-Viking", "Creed Viking", "2026-09-27T10:00:00Z");
    l = mergeMissing(l, "creed-viking", "Creed Viking", "2026-09-28T10:00:00Z");
    expect(l).toEqual([
      { slug: "creed-viking", name: "Creed Viking", count: 2, firstAt: "2026-09-27T10:00:00Z", lastAt: "2026-09-28T10:00:00Z" },
    ]);
  });

  it("oxirgi so'ralgani birinchi turadi", () => {
    let l = mergeMissing([], "a-atir", "A", "2026-09-27T10:00:00Z");
    l = mergeMissing(l, "b-atir", "B", "2026-09-27T11:00:00Z");
    expect(l.map((m) => m.slug)).toEqual(["b-atir", "a-atir"]);
  });

  it("o'chirish va bo'sh slug", () => {
    const l = mergeMissing([], "x-y", "X Y", "2026-09-27T10:00:00Z");
    expect(removeMissing(l, "X-Y")).toEqual([]);
    expect(mergeMissing(l, "---", "", "2026-09-27T10:00:00Z")).toBe(l);
    expect(normalizeMissingSlug("Тайгер  Булгари!")).toBe("тайгер-булгари");
  });
});

describe("callbackSlug / missingTitle", () => {
  it("Telegram callback_data 64 baytdan oshmaydi (kirill ham)", async () => {
    const { callbackSlug, missingTitle } = await import("./missing-perfumes");
    const long = callbackSlug("очень-длинное-название-аромата-которое-не-влезает-в-лимит");
    expect(new TextEncoder().encode("mpok_" + long).length).toBeLessThanOrEqual(64);
    expect(long.endsWith("-")).toBe(false);
    expect(callbackSlug("Creed-Viking")).toBe("creed-viking");
    expect(missingTitle("creed-viking")).toBe("Creed Viking");
  });
});
