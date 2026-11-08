# Alif automatic receipts production release

Owner explicitly requested launching the existing hosted checkout while awaiting Alif's answer about a browser-only installment integration. Owner selected automatic fiscal receipts by Alif.

Added fiscal mode `alif`, requiring explicit 17-digit SPIC and integer VAT percentage. Invoice creation includes `receipt:true`, customer phone, item SPIC and VAT. Values for this perfume store reuse the existing Click integration: SPIC `03303001001000000`, VAT 12. No new merchant identity or tax rate was invented. Tax receipt links returned by getInvoice are exposed only for HTTPS `ofd.soliq.uz` URLs.

Sandbox validation accepted a fiscal invoice: `081bd932-cd5b-4524-9927-079d2bf9762f`, receipt=true. This was an unpaid sandbox invoice; no real charge or fiscal receipt generation was performed. Actual paid receipt generation and provider webhook delivery require a completed customer payment and remain unverified.

Tests: full suite 222 passed before the receipt-link test; final focused Alif suite 28 passed in independent review. TypeScript/scoped ESLint passed before receipt-link changes; release CI must validate final source. Local initial build failed due sandbox Google Fonts network restriction and was rerun with network access.

Hosted checkout continues to offer the provider's existing app/QR installment journey. CARD/OTP is a one-time full charge; sendInvoice sends a payment link. Neither is represented as app-free installment checkout. No real customer payment was executed by this release.
