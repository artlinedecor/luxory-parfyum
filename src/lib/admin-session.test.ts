import { describe, it, expect, beforeAll } from "vitest";
import { createSessionToken, verifySessionToken } from "./admin-session";

beforeAll(() => {
  process.env.ADMIN_SESSION_SECRET = "test-secret-kamida-32-belgi-bolsin!!";
});

describe("admin-session", () => {
  it("yaratilgan tokenni qabul qiladi", async () => {
    const t = await createSessionToken("admin@example.com");
    expect(await verifySessionToken(t)).toEqual({ email: "admin@example.com" });
  });

  it("eski doimiy qiymatni RAD ETADI", async () => {
    expect(await verifySessionToken("authenticated")).toBeNull();
  });

  it("o'zgartirilgan imzoni rad etadi", async () => {
    const t = await createSessionToken("admin@example.com");
    expect(await verifySessionToken(t.slice(0, -3) + "aaa")).toBeNull();
  });

  it("muddati o'tgan tokenni rad etadi", async () => {
    const t = await createSessionToken("admin@example.com", Date.now() - 1000);
    expect(await verifySessionToken(t)).toBeNull();
  });

  it("token yo'q bo'lsa null qaytaradi", async () => {
    expect(await verifySessionToken(undefined)).toBeNull();
  });
});
