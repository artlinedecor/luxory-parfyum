import { describe, it, expect } from "vitest";
import { readCookie } from "./cookies";

describe("readCookie", () => {
  it("yagona cookie'ni o'qiydi", () => {
    expect(readCookie("admin_session=AAA.BBB", "admin_session")).toBe("AAA.BBB");
  });

  it("cookie OXIRIDA bo'lsa ham topadi", () => {
    // ⚠️ Regressiya: eski regex `(?:^|;s*)` ga aylanib qolgan edi va
    // admin_session birinchi bo'lmaganda topilmasdi — brauzerda admin
    // paneli 401 olardi.
    expect(readCookie("admin_logged_in=true; admin_session=AAA.BBB", "admin_session"))
      .toBe("AAA.BBB");
  });

  it("o'rtada bo'lsa ham topadi", () => {
    expect(readCookie("a=1; admin_session=X; b=2", "admin_session")).toBe("X");
  });

  it("bo'shliqsiz ajratilgan bo'lsa ham topadi", () => {
    expect(readCookie("a=1;admin_session=X", "admin_session")).toBe("X");
  });

  it("nomi o'xshash cookie bilan adashmaydi", () => {
    expect(readCookie("xadmin_session=YOLGON; admin_session=TOGRI", "admin_session"))
      .toBe("TOGRI");
    expect(readCookie("admin_session_old=YOLGON", "admin_session")).toBeUndefined();
  });

  it("qiymatida = bo'lsa to'liq qaytaradi", () => {
    expect(readCookie("admin_session=a=b=c", "admin_session")).toBe("a=b=c");
  });

  it("yo'q bo'lsa undefined", () => {
    expect(readCookie("a=1; b=2", "admin_session")).toBeUndefined();
    expect(readCookie("", "admin_session")).toBeUndefined();
  });
});
