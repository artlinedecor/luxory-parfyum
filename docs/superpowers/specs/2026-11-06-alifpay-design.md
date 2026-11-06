# Alif hosted checkout

User requested connecting and checking Alif after providing sandbox credentials. Implementation choice: hosted Alif checkout, following the existing Next route/Supabase order patterns. Direct card collection adds unnecessary sensitive data handling; Uzum's verification and calculator APIs do not apply to Alif.

The cart gets an Alif button with Uzbek/Russian copy. Server configuration decides visibility and mode. Default is off; local sandbox is enabled explicitly. In a production deployment sandbox is admin-only. Production credentials are separate and production also requires explicit fiscal handling configuration.

Server computes prices and persists a draft before creating an invoice. Existing orders schema supports full_payment; provider metadata resides in items[0].alif_checkout, as with Uzum metadata. A UUID attempt and random recovery token survive retries; the stored hash authorizes status/recovery. Unique order ID arbitrates parallel creation. Never automatically create a second invoice after an uncertain result.

Persist invoice ID before returning checkout URL. Lost database response after invoice creation returns a signed recovery receipt so retry can restore the mapping without a second invoice. Invoice expires after an hour. Browser return is not payment proof. Signed raw-body webhook and authorized status checks query getInvoice and validate ID, amount and meta order binding. Only SUCCEEDED is paid. REVERTED cancels payment; HELD/PENDING stay pending. Compare-and-swap protects concurrent processing.

Sandbox rows stay cancelled/unpaid, cannot enter fulfilment or Click, are excluded from operational dashboard, and never clear the cart or send notifications. Payment simulation lives only in an explicit local diagnostic script, never an app API. Production rows may become paid/processing after verification; no invented installment terms or calculator.

No schema migration, new dependency, live charge, customer SMS, or external message is needed. Test token validity and sandbox simulation were already observed. Remaining verification includes unit/route tests, build, local UI and actual sandbox round trip. Public provider webhook delivery requires a deployed reachable handler; report this separately from locally signed callback tests.
