import { describe, expect, it } from "vitest";
import { buyerNextStep, isSignedContract } from "./uzum-flow";

describe("Uzum buyer routing", () => {
  it("calculates for a verified buyer even without an aggregate balance", () => {
    expect(buyerNextStep({ status: 4, buyer_id: 123, has_limit: true,
      available_periods: [{ available_balance: "800000" }] }).step).toBe("calculate");
  });
  it("lets calculate determine which period fits instead of rejecting by aggregate balance", () => {
    expect(buyerNextStep({ status: 4, buyer_id: 123, balance: "0" }).step).toBe("calculate");
  });
  it("only offers registration for an explicitly incomplete registration", () => {
    expect(buyerNextStep({ status: 1, webview: "https://auth.uzumnasiya.uz/" }).step).toBe("verify");
    expect(buyerNextStep({ status: 4, webview: "https://auth.uzumnasiya.uz/" }).step).toBe("error");
    expect(buyerNextStep({ status: 99, webview: "https://auth.uzumnasiya.uz/" }).step).toBe("error");
  });
  it("blocks blacklisted buyers even when status is verified", () => {
    expect(buyerNextStep({ status: 4, buyer_id: 123, is_in_black_list: true }).step).toBe("blocked");
  });
  it("explains the missing registration link instead of sending the buyer nowhere", () => {
    const result = buyerNextStep({ status: 1 });
    expect(result.step).toBe("verify");
    expect(result.webview).toBeUndefined();
    expect(result.message).toMatch(/havola.*qaytarmadi/i);
  });
  it.each([[5, /pasport.*surat/i], [10, /selfi/i], [11, /ro'yxatga olingan.*sahifa/i], [12, /kontakt/i]])("gives an actionable explanation for status %s", (status, expected) => {
    expect(buyerNextStep({ status, webview: "https://auth.uzumnasiya.uz/register" }).message).toMatch(expected);
  });
  it.each(["http://auth.uzumnasiya.uz/", "https://uzumnasiya.uz.evil.example/", "javascript:alert(1)"])("does not offer an unsafe verification URL %s", (webview) => {
    expect(buyerNextStep({ status: 1, webview }).webview).toBeUndefined();
    expect(buyerNextStep({ status: 1, webview }).message).toMatch(/havola.*qaytarmadi/i);
  });
});

describe("Uzum signature", () => {
  it("does not treat moderation alone as a signature", () => {
    expect(isSignedContract({ contract_status: 2, is_signed: false })).toBe(false);
    expect(isSignedContract({ contract_status: 2 })).toBe(false);
  });
  it("accepts an explicit signature, including a contract awaiting activation", () => {
    expect(isSignedContract({ contract_status: 0, is_signed: true })).toBe(true);
    expect(isSignedContract({ contract_status: 2, is_signed: true })).toBe(true);
    expect(isSignedContract({ contract_status: 1 })).toBe(false);
    expect(isSignedContract({ contract_status: 1, is_signed: true })).toBe(true);
  });
  it("does not revive cancelled contracts or override an explicit missing signature", () => {
    expect(isSignedContract({ contract_status: 5, is_signed: true })).toBe(false);
    expect(isSignedContract({ contract_status: 1, is_signed: false })).toBe(false);
  });
});
