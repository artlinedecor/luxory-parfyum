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
