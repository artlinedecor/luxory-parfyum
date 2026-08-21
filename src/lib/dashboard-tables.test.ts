import { describe, it, expect } from "vitest";
import { assertAllowed, ALLOWED_TABLES } from "./dashboard-tables";

describe("assertAllowed", () => {
  it("ruxsat berilgan jadval va amalni o'tkazadi", () => {
    expect(() => assertAllowed("orders", "update")).not.toThrow();
    expect(() => assertAllowed("transactions", "insert")).not.toThrow();
    expect(() => assertAllowed("products", "delete")).not.toThrow();
  });

  it("ro'yxatda yo'q jadvalni RAD ETADI", () => {
    expect(() => assertAllowed("users", "delete")).toThrow(/jadval/i);
    expect(() => assertAllowed("auth.users", "select")).toThrow(/jadval/i);
    expect(() => assertAllowed("uzum_contracts", "delete")).toThrow(/jadval/i);
  });

  it("noma'lum amalni RAD ETADI", () => {
    expect(() => assertAllowed("orders", "drop")).toThrow(/amal/i);
    expect(() => assertAllowed("orders", "")).toThrow(/amal/i);
  });

  it("SQL qo'shishga urinishni rad etadi", () => {
    expect(() => assertAllowed("orders; drop table orders", "delete")).toThrow(/jadval/i);
  });

  it("ruxsat ro'yxatida faqat 3 ta jadval bor", () => {
    expect([...ALLOWED_TABLES].sort()).toEqual(["orders", "products", "transactions"]);
  });
});
