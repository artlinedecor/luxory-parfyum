# Uzum Nasiya fix implementation plan

Agreed scope: repair buyer routing, calculator details, registration return, durable checkout recovery, idempotency and verified purchase completion.

- [x] Add regression tests for verified buyers with optional balance, registration-only routing and explicit contract signatures.
- [x] Fix checkout routing, persist the registration form, show deposits and first payment dates.
- [x] Persist a pending order before the remote create call. Use its primary key as an idempotency lock, keep integration metadata in the existing items JSONB field, and link contracts before redirecting. Recover using a private checkout cookie and server records, with webhook ID matching against stored metadata.
- [ ] Verify the server lifecycle with mocked bank/storage tests, run type checking/tests/build, deploy through the existing GitHub production flow and verify public routes without creating a live loan.

No new database privileges or schema changes are required. Existing orders and uzum_contracts tables remain the durable store. A checkout may appear as awaiting completion before it is signed; only bank-verified signatures complete it. Ambiguous bank timeouts do not automatically create a second contract.
