import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchUzumRead, friendlyUzumError } from "./uzum-checkout-client";
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe("Uzum read requests", () => {
  it("times out stalled eligibility checks and never retries them", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    vi.stubGlobal("fetch", fetcher);
    const result = fetchUzumRead("/api/uzumnasiya/check-status", { phone: "998901234567" });
    const assertion = expect(result).rejects.toThrow(/Uzum.*javob bermadi/);
    await vi.advanceTimersByTimeAsync(30000); await assertion;
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("returns the bank's validation response for the existing error UI", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Limit yetarli emas" }), { status: 400 })));
    expect(await fetchUzumRead("/api/uzumnasiya/calculate", {})).toEqual({ ok: false, data: { error: "Limit yetarli emas" } });
  });
  it("does not expose raw HTML/JSON parser errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>proxy error</html>")));
    await expect(fetchUzumRead("/api/uzumnasiya/check-status", {})).rejects.toThrow(/Uzum.*javobini/);
  });
  it("explains common browser connection failures", () => {
    expect(friendlyUzumError("Failed to fetch")).toMatch(/aloqa/i);
    expect(friendlyUzumError("Load failed")).toMatch(/aloqa/i);
  });
});
