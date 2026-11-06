import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
const f = vi.hoisted(() => ({ authorize: vi.fn(), refresh: vi.fn(), row: vi.fn(), admin: vi.fn() }));
vi.mock("./alif-checkout", () => ({ recoverAlifCheckout: f.authorize, refreshAlifCheckout: f.refresh, alifMeta: (row: { items: { alif_checkout: unknown }[] }) => row.items[0].alif_checkout }));
vi.mock("./alif-checkout-store", () => ({ alifStore: { get: f.row } }));
vi.mock("./api-guard", () => ({ requireAdmin: f.admin }));
import { POST as webhook } from "@/app/api/alifpay/webhook/route";
import { POST as status } from "@/app/api/alifpay/status/route";
import { GET as config } from "@/app/api/alifpay/config/route";
import { AlifError } from "./alifpay";
const id = "d7c1a451-ed20-49b1-a37d-164c3f3e49e6";
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("ALIFPAY_MODE", "sandbox");
  vi.stubEnv("ALIFPAY_TEST_API_TOKEN", "test-token"); vi.stubEnv("ALIFPAY_TEST_WEBHOOK_SECRET", "key");
  f.row.mockResolvedValue({ items: [{ alif_checkout: { mode: "sandbox" } }] });
  f.refresh.mockResolvedValue({ state: "paid", sandbox: true }); f.authorize.mockResolvedValue({});
  f.admin.mockResolvedValue(new Response(null, { status: 401 }));
});
const callback = (body: string, signature?: string) => new Request(`http://localhost/api/alifpay/webhook?order_id=${id}`, { method: "POST", body,
  headers: signature ? { Signature: signature } : {} });
const sign = (body: string) => createHmac("sha256", "key").update(body).digest("base64");
describe("Alif routes", () => {
  it("rejects unsigned and tampered callbacks without reconciliation", async () => {
    expect((await webhook(callback("{}"))).status).toBe(401);
    expect((await webhook(callback('{ "x": 1 }', sign('{"x":1}')))).status).toBe(401);
    expect(f.refresh).not.toHaveBeenCalled();
  });
  it("acknowledges only after durable reconciliation and allows redelivery", async () => {
    for (let i = 0; i < 2; i++) expect((await webhook(callback("{}", sign("{}")))).status).toBe(200);
    expect(f.refresh).toHaveBeenCalledTimes(2);
    f.refresh.mockRejectedValue(new Error("db unavailable"));
    expect((await webhook(callback("{}", sign("{}")))).status).toBe(503);
  });
  it("requires recovery token or private cookie for status", async () => {
    f.authorize.mockRejectedValue(new AlifError("Unauthorized", 403));
    const response = await status(new Request("http://localhost/api/alifpay/status", { method: "POST", body: JSON.stringify({ order_id: id }) }));
    expect(response.status).toBe(403); expect(f.refresh).not.toHaveBeenCalled();
    f.authorize.mockResolvedValue({});
    expect((await status(new Request("http://localhost/api/alifpay/status", { method: "POST", headers: { Cookie: `other=1; alif_${id}=private-token` }, body: JSON.stringify({ order_id: id }) }))).status).toBe(200);
    expect(f.authorize).toHaveBeenLastCalledWith(id, "private-token", undefined);
  });
  it("hides sandbox and blocks status for real shoppers in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await (await config(new Request("https://shop.test/api/alifpay/config"))).json()).toEqual({ enabled: false });
    expect((await status(new Request("https://shop.test/api/alifpay/status", { method: "POST", body: "{}" }))).status).toBe(401);
    expect(f.refresh).not.toHaveBeenCalled();
  });
  it("blocks cross-origin browser status requests", async () => {
    expect((await status(new Request("http://localhost/api/alifpay/status", { method: "POST", headers: { Origin: "https://other.test" }, body: "{}" }))).status).toBe(403);
  });
});
