# Uzum Nasiya audit and customer support — 2026-11-06

## Scope and official evidence

Reviewed the current Partner API 1.0.2 documentation at https://developer.uzumbank.uz/nasiya/ and its published `redocusaurus/ru_nasiya.yaml` specification. Public dev host: https://dev-merchants-api.uzumnasiya.uz.

- Buyer statuses 0, 1, 2, 5, 10, 11, 12 require the bank-provided registration/verification WebView.
- Status 4 proceeds directly to the calculator; `balance` and `has_limit` must not replace the calculator's eligibility decision.
- Statuses 8, 9, 13, 14, 403 prohibit checkout.
- The calculator documents monthly payment, deposit and first payment date. These must be shown and revalidated before creating a new contract.
- An unauthenticated, empty check-status request to the dev host returned HTTP 401. No buyer phone was submitted, no SMS requested and no contract created.

## Findings fixed

1. Missing registration links and generic document messages left customers without a clear next step. Added status-specific guidance and contextual support without inventing a registration URL.
2. Read-only status/calculation requests could remain pending indefinitely. Added a 30-second timeout, friendly network/invalid-response messages and manual retry. Contract creation is never automatically retried.
3. Only the quoted total was compared before contract creation. New checkouts now compare the approved monthly payment, deposit and first payment date against a fresh bank calculation. Missing or malformed terms block creation. Existing contract recovery remains compatible.
4. Added the owner's exact Telegram link, https://t.me/I004uzb, in checkout error/blocked/missing-link states and unsuccessful payment results. Normal verification has a collapsed help option. Uzbek and Russian copy asks customers to screenshot the error and send it themselves. SMS, card and document details should be hidden. The site does not capture or send screenshots automatically.
5. Removed misleading claims that no card is needed, only phone/SMS suffice, and every contract takes two minutes. Both languages now explain that new customers may need a card and documents and that the calculator determines available terms.

## Validation

- 220 tests passed across 25 files, including quote changes, malformed terms, existing-loan recovery, bank timeouts and verification statuses.
- TypeScript and scoped ESLint for the checkout changes passed. The separately edited translation file retains its pre-existing unused `mounted` warning and synchronous-effect error at `setMounted(true)`; this change only edits translation strings.
- Independent read-only review found no remaining material findings in this change.
- Production build passed. The local build could not access Supabase during static generation (sandbox network restriction); its existing fallback completed successfully.
- Browser fixtures verified missing verification URL, normal passport verification, blocked buyer, status 4 with zero balance proceeding to calculate, malformed quote and network failure. Telegram target is exact, opens a new tab, and is collapsed during normal verification. No bank create request was issued. No horizontal overflow at 320 or 390 pixels.

## Limits

No local Uzum sandbox credential was available. Production credentials were not repurposed for the dev host. Authenticated dev onboarding, actual identity/limit approval, provider OTP and a real new-customer purchase remain unverified. A separate test token and bank-provided test customer are needed for those checks.
