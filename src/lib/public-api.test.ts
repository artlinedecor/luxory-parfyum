import { describe, it, expect } from "vitest";
import { checkApiKey } from "./public-api";

const req = (key?: string) =>
  new Request("https://parfumelux.uz/api/public/products?q=x", key ? { headers: { "x-api-key": key } } : undefined);

describe("checkApiKey", () => {
  it("to'g'ri kalit — ruxsat", () => {
    expect(checkApiKey(req("secret-123"), "secret-123")).toBe(true);
  });

  it("noto'g'ri yoki yo'q kalit — rad", () => {
    expect(checkApiKey(req("secret-124"), "secret-123")).toBe(false);
    expect(checkApiKey(req("secret"), "secret-123")).toBe(false);
    expect(checkApiKey(req(), "secret-123")).toBe(false);
  });

  it("serverda kalit sozlanmagan bo'lsa — hech kimga ruxsat yo'q", () => {
    expect(checkApiKey(req(""), "")).toBe(false);
    expect(checkApiKey(req("anything"), undefined)).toBe(false);
  });
});
