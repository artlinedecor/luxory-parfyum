// Explicit sandbox diagnostic. No app route can simulate payments.
import nextEnv from "@next/env";
import { createHmac } from "node:crypto";
import { writeFileSync } from "node:fs";
nextEnv.loadEnvConfig(process.cwd());
const arg = name => process.argv[process.argv.indexOf(name) + 1];
const invoiceId = arg("--invoice"), orderId = arg("--order"), local = new URL(arg("--local") || "http://localhost:3006");
if (!process.argv.includes("--invoice") || !process.argv.includes("--order") || !/^[0-9a-f-]{36}$/i.test(invoiceId) || !/^[0-9a-f-]{36}$/i.test(orderId)) throw new Error("Pass existing sandbox --invoice and --order UUIDs");
if (!["localhost", "127.0.0.1"].includes(local.hostname) || local.protocol !== "http:" || local.username || local.password) throw new Error("Only a local development callback is allowed");
if (process.env.ALIFPAY_MODE !== "sandbox") throw new Error("ALIFPAY_MODE must be sandbox");
const token = process.env.ALIFPAY_TEST_API_TOKEN, key = process.env.ALIFPAY_TEST_WEBHOOK_SECRET;
if (!token || !key) throw new Error("Test credentials missing");
const steps = [];
async function provider(method, body) {
  if (!["getInvoice", "_payInvoiceWithMobi"].includes(method)) throw new Error("Method not allowed");
  const response = await fetch(`https://api-dev.alifpay.uz/v2/${method}`, { method: "POST", redirect: "error", signal: AbortSignal.timeout(25000), headers: { "Content-Type": "application/json", Token: token }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Sandbox HTTP ${response.status}`);
  const value = await response.json();
  if (value.error) throw new Error(`Sandbox error ${value.error.code}`);
  return value;
}
const before = await provider("getInvoice", { id: invoiceId });
if (before.meta?.order_id !== orderId || before.meta?.mode !== "sandbox") throw new Error("Invoice does not belong to this sandbox order");
steps.push({ step: "before", state: before.payment?.status || "UNPAID", amount: before.price });
if (!before.payment?.status) {
  const paid = await provider("_payInvoiceWithMobi", { invoice_id: invoiceId, installment: true });
  steps.push({ step: "sandbox_installment_simulation", state: paid.payment?.status, method: paid.payment?.method?.type, installment: paid.payment?.method?.payload?.bml });
}
const after = await provider("getInvoice", { id: invoiceId });
if (after.payment?.status !== "SUCCEEDED" || after.payment.amount !== before.price) throw new Error("Sandbox payment not confirmed");
steps.push({ step: "after", state: after.payment.status, amount: after.payment.amount });
const callback = new URL(`/api/alifpay/webhook?order_id=${orderId}`, local);
const body = JSON.stringify({ invoice_id: invoiceId, payment: { id: after.payment.id, status: "SUCCEEDED" } });
const signature = createHmac("sha256", key).update(body).digest("base64");
for (const [label, signedBody, headers, expected] of [
  ["unsigned_callback", body, {}, 401],
  ["tampered_callback", body + " ", { Signature: signature }, 401],
  ["local_signed_callback", body, { Signature: signature }, 200],
  ["duplicate_callback", body, { Signature: signature }, 200],
]) {
  const response = await fetch(callback, { method: "POST", redirect: "error", headers: { "Content-Type": "application/json", ...headers }, body: signedBody, signal: AbortSignal.timeout(30000) });
  steps.push({ step: label, http: response.status });
  if (response.status !== expected) throw new Error(`${label} expected ${expected}, got ${response.status}`);
}
const status = await fetch(new URL("/api/alifpay/status", local), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: orderId }) });
steps.push({ step: "unauthorized_status", http: status.status });
if (status.status !== 403) throw new Error("Status authorization failed");
const report = { date: new Date().toISOString(), environment: "sandbox", order_id: orderId, invoice_id: invoiceId, provider_callback_delivery: "not tested; locally signed callback only", steps };
writeFileSync("scratch/alifpay-app-sandbox-check-2026-11-06.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
