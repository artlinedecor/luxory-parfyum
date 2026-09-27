import { describe, it, expect } from "vitest";
import { sortByPopularity } from "./popularity";

const p = (id: string, title: string) => ({ id, title, stock: 0 });

describe("sortByPopularity", () => {
  it("mashhurlar ro'yxat tartibida birinchi, qolganlari o'z tartibida", () => {
    const list = [
      p("1", "Chase White King"),
      p("2", "Creed Aventus"),
      p("3", "HFC Dry Wood"),
      p("4", "Dior Sauvage Eau de Parfum 100 ml"),
    ];
    const out = sortByPopularity(list, ["dior-sauvage-edp", "creed-aventus"]);
    expect(out.map((x) => x.id)).toEqual(["4", "2", "1", "3"]);
  });

  it("katalogda yo'q mashhur atir hech narsani buzmaydi", () => {
    const list = [p("1", "A atir"), p("2", "B atir")];
    expect(sortByPopularity(list, ["creed-viking"]).map((x) => x.id)).toEqual(["1", "2"]);
  });
});
