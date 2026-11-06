# Alifpay sandbox check — 2026-11-06

Only the sandbox API was used: `https://api-dev.alifpay.uz/v2`, verified in the sandbox tab of the [official documentation](https://docs.alifpay.uz/).

Credentials are stored in ignored `.env.local` as server-only `ALIFPAY_TEST_API_TOKEN` and `ALIFPAY_TEST_WEBHOOK_SECRET`. No secret values are included in this report.

## Observed results

- Unauthenticated `getInvoice`: HTTP 401.
- Authenticated lookup of a nonexistent invoice: HTTP 200, business error 1004 (`invoice not found`), confirming token acceptance.
- Created sandbox invoice `afd75796-fb5b-4d35-aad4-19a7761f5374` for 80,000,000 tiyin (800,000 UZS).
- Initial invoice payment status: UNPAID.
- Sandbox-only `_payInvoiceWithMobi` with `installment: true`: SUCCEEDED, method MOBI, `bml: true`.
- Subsequent `getInvoice`: SUCCEEDED, amount 80,000,000 tiyin.

Sanitized API results are recorded in `scratch/alifpay-sandbox-test-2026-11-06.json`.

## Limits and remaining work

This confirms sandbox authentication and simulated installment payment. It does not confirm live merchant installment activation, repayment terms, or customer eligibility.

No production payment, customer phone, card, SMS, database order, or live deployment was involved. The simulated invoice remains SUCCEEDED in sandbox.

The supplied webhook key has been stored but has not been verified against a real provider callback. Website integration still needs invoice creation, checkout navigation, authenticated status reconciliation, and a durable webhook handler that verifies the Signature against the raw request body. Follow the [checkout documentation](https://docs.alifpay.uz/checkout/).
