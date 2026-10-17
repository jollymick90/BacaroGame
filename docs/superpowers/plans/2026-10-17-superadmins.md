# Superadmin implementation plan

Goal: Permanent superadmins configured on the server can manage delegated roles in the interface and register other consenting people.

Architecture: BACARODEX_SUPERADMIN_EMAILS is the permanent root list. Delegated email roles live in the fixed superadmins document in bacaroGameConfigurations, accessed only through the existing gateway. Login still requires verified email; permanent roots also qualify for login. Delegated users must remain in BACARODEX_ALLOWED_EMAILS. Server APIs reload roles for each operation; role mutations use transactions. Existing UID registrations remain compatible; registrations for others use generated IDs and record the operator and consent mode.

- [x] Test email normalization, permanent-role precedence, eligibility, revocation, and registration ownership.
- [x] Implement role policy, Firestore role service, and authenticated same-origin role APIs. Permanent roles cannot be revoked. Prevent removal of the last effective superadmin.
- [x] Extend member registration/deletion with explicit self/other mode, server-side superadmin authorization, generated IDs for others, operator attribution, and separate consent attestation.
- [x] Add role-management UI and update registration UI with readable Svelte 5 code. Ordinary members retain self-only registration and deletion; superadmins can manage all registrations.
- [x] Document configuration and consent/revocation workflow. Run type checks, all project tests, and build. Review authorization boundaries and report verification limits.

Constraints: No new collections or dependencies; no biometric logs; Italian UI; server-only credentials; existing collection limit of 200 remains.


Validation: authorization policy and real route handlers exercised with a test-only persistence boundary; no cloud writes. Independent code review found no remaining important issues. Production build has adapter dependency-tracing warnings for google-gax metadataResolver and optional supports-color; these do not fail the build. Live Firebase and browser interaction still require deployment/local emulator validation.
