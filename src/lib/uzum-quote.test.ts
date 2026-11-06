import { describe, expect, it } from "vitest";
import { parseUzumQuote } from "./uzum-quote";
describe("Uzum payment terms", () => {
  const valid = { month: 266667, deposit: 0, first_payment_date: "2026-12-01" };
  it("accepts explicit zero deposit and normalizes bank strings and date-time", () => {
    expect(parseUzumQuote({ month: "266667.00", deposit: "0.00", first_payment_date: "2026-12-01T00:00:00+05:00" })).toEqual(valid);
  });
  it.each([undefined, null, {}, { ...valid, deposit: undefined }, { ...valid, deposit: null }, { ...valid, deposit: "" },
    { ...valid, deposit: -1 }, { ...valid, month: Infinity }, { ...valid, month: false },
    { ...valid, first_payment_date: "" }, { ...valid, first_payment_date: "2026-02-30" }, { ...valid, first_payment_date: "01.12.2026" }])("rejects missing or invalid material terms: %j", value => {
    expect(parseUzumQuote(value)).toBeNull();
  });
});
