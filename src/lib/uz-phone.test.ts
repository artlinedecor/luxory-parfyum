import { describe, expect, it } from "vitest";
import { uzPhoneDigits, formatUzPhone, isUzPhone } from "./uz-phone";
describe("Uzbek phone entry", () => {
  it.each(["99 102 02 00", "+998 (99) 102-02-00", "998991020200", "00998991020200"])("normalizes %s", value => {
    expect(uzPhoneDigits(value)).toBe("991020200");
  });
  it("formats progressively and accepts clearing", () => {
    expect(formatUzPhone("991020200")).toBe("99 102 02 00");
    expect(formatUzPhone("9910")).toBe("99 10"); expect(uzPhoneDigits("")).toBe("");
  });
  it("rejects extra digits rather than changing the recipient", () => {
    expect(uzPhoneDigits("9989910202001")).toBeNull();
    expect(isUzPhone("9989910202001")).toBe(false);
    expect(isUzPhone("998991020200")).toBe(true);
    expect(isUzPhone("99899")).toBe(false);
  });
});
