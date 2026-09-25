import { describe, it, expect } from "vitest";
import { formatUzs } from "./utils";

describe("formatUzs", () => {
  it("minglarni uzilmas probel bilan ajratadi — vergul emas", () => {
    expect(formatUzs(800000)).toBe("800 000");
    expect(formatUzs(12772120)).toBe("12 772 120");
  });

  it("kichik son va yaxlitlash", () => {
    expect(formatUzs(950)).toBe("950");
    expect(formatUzs(1234.6)).toBe("1 235");
  });

  it("noto'g'ri qiymat — 0, NaN emas", () => {
    expect(formatUzs(Number.NaN)).toBe("0");
  });
});
