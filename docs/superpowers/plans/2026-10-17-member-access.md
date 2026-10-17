# Member access management

Goal: Superadmins can add and remove authorized member emails from the existing admin interface without editing Vercel.

Design: Keep the fixed bacaroGameConfigurations/superadmins document. Preserve its delegated emails field and add allowedEmails and blockedEmails. Effective access combines BACARODEX_ALLOWED_EMAILS with stored additions, excluding stored removals. BACARODEX_SUPERADMIN_EMAILS always grants access. Removing access also removes delegated role; reenabling access never restores that role implicitly. Existing documents need no migration. Session creation and every authenticated request consult effective access; verified Google email remains mandatory in production. Firestore failure must not be treated as an invalid session.

- [x] Add regression tests for new-email login, normalized/idempotent additions, revoked existing sessions, authorization, permanent protection, last-admin protection, and role preservation.
- [x] Implement transactional access updates and shared effective-access evaluation. Update hooks and login to await persisted access checks.
- [x] Extend role panel with email input and access controls. Preserve permanent roots and separate access from role grants.
- [x] Update configuration docs; run full tests, check, build, and independent code review.

No new collections, dependencies, external messages, deployments, or cloud mutations. Removing access does not delete member records.

Validation: 47 tests passed across all existing suites, new access API, real session route and request hook with a test-only Firebase boundary. npm run check: zero errors/warnings. npm run build succeeded with adapter dependency-tracing warnings for google-gax metadataResolver and supports-color. Independent review: no important findings. No live Firebase or browser validation performed; no deployment.
