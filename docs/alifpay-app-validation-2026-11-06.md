# Alif checkout validation — 2026-11-06

## Implemented

Cart action, hosted checkout navigation, return/status page, server-only provider client, durable draft/invoice binding, signed recovery receipt, authenticated status and raw-body HMAC webhook verification. Prices come from the product database and are converted from UZS to integer tiyin. Duplicate creation and stale callback transitions are guarded.

Configuration is runtime/server-only. Default is off. Sandbox on a production deployment requires an admin session; ordinary shoppers cannot start simulated purchases. Sandbox orders stay cancelled/unpaid, are omitted from dashboard reporting, cannot be fulfilled or paid through Click, and do not clear the cart or send notifications. Existing orders schema is reused without migration.

## Actual sandbox round trip

The local Next server created order `8eb4a3b6-4b3e-4996-aad3-e2563fc9a51b` and invoice `396423c1-3f6b-41fe-838f-392f2803becf` through the cart button.

Alif checkout displayed merchant ELORE PARFUME, the database product title Carolina Herrera 212 Sexy Men Eau de Toilette, and 800,000 UZS. Its sandbox installment calculator showed 3 months at 0%. This observation does not establish production terms.

Sandbox-only installment simulation returned SUCCEEDED/MOBI with installment enabled. Subsequent getInvoice confirmed 80,000,000 tiyin. Local callback results: unsigned 401, altered-body signature 401, valid signature 200, duplicate delivery 200. Status without a recovery token/private cookie returned 403.

The return page showed payment confirmation plus an explicit test notice. The cart retained its item. A service-role read confirmed provider state paid but database fulfilment cancelled and payment_status unpaid. Mobile viewport 390×844 had no horizontal overflow.

Provider-owned delivery to a public deployed webhook has not been verified. The callback tests used locally generated signatures and independent real sandbox getInvoice reconciliation. No real card, customer SMS, or actual money was used. The old standalone sandbox test invoice is separate.

The provider can return an empty payment object for an unpaid invoice; this was reproduced, covered by a failing regression test, and corrected without weakening paid-amount validation.

## Checks

- 189 tests passed, including 25 Alif tests across four files.
- TypeScript --noEmit passed.
- Next production build --webpack passed, including route generation and TypeScript.
- Normal Turbopack build was blocked by its Google Fonts connection on this machine; Node could fetch the same endpoint. No product font/config change was made for this environment issue.
- New Alif source lint passed. Existing Click/dashboard changes have four pre-existing unused-variable warnings. Full src lint still reports 80 errors/26 warnings in existing code outside the new Alif source; these were not changed as part of payment integration.
- The 107 built browser asset files contained zero occurrences of either supplied test secret.
- Independent reviewer found no remaining important issues after fixes for stale-price retry identity and delivered-refund accounting preservation.

## Deployment and production requirements

Follow-up: Vercel team access was granted. The preview build logs reproduced a Turbopack next/font import failure (`@vercel/turbopack-next/internal/font/google/font`, "queries have exactly one entry"). The package build command now explicitly uses `next build --webpack`; the exact `npm run build` completed successfully after this change. The 25 Alif tests also passed again.

Separate production credentials were saved in ignored local settings and Vercel sensitive production variables. An authenticated production getInvoice lookup of a random nonexistent invoice returned HTTP 200/business code 1004, confirming token acceptance without creating an invoice or payment. Sandbox credentials, mode=sandbox and the HTTPS site origin were added to production environment settings for admin-only tests. No production fiscal handling has been selected: the owner does not yet know who issues fiscal receipts. Real Alif purchases remain disabled.

Vercel project: `y06042025-8137s-projects/luxory-parfyum`, verified from the existing successful main commit status. Environment configuration currently requires signing into the owning Vercel account. Local `.env.local` contains sandbox settings only and remains ignored by Git.

For deployed admin-only sandbox testing, configure ALIFPAY_MODE=sandbox, ALIFPAY_TEST_API_TOKEN, ALIFPAY_TEST_WEBHOOK_SECRET, and ALIFPAY_SITE_URL for the deployed HTTPS origin. Never commit credentials. Re-test a fresh invoice with a real provider-delivered callback after deployment.

Production requires separate ALIFPAY_API_TOKEN and ALIFPAY_WEBHOOK_SECRET. ALIFPAY_MODE=production is additionally gated on ALIFPAY_FISCAL_MODE=external, which must only be set when the merchant has arranged fiscal receipts outside Alif. Otherwise implement/validate Alif fiscal receipt parameters first. Confirm live installment activation and terms with Alif before advertising them. App routes intentionally do not expose the sandbox simulation API.

Delivered refunds preserve fulfilment status and mark payment cancelled; the admin must use the normal order reversal path to reverse stock/income. Browser status remains recoverable after callback failure. No automatic production notification or separate Alif limit/calculator API is implemented.
