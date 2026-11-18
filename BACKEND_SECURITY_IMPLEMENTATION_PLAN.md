# Backend Security Implementation Plan

## Working Rules

- Implement one item at a time.
- After each item, run its focused test and verify the behavior.
- Do not begin the next item until the user reviews the result and asks to continue.
- Keep production-only configuration separate from local development defaults.

## Findings and Order

1. **Complete: Restrict program dashboard aggregates.** Limit organization-wide budget, spending, and beneficiary statistics to admins and coordinators. Added a regression test that confirms a member receives `403` while staff access remains allowed.
2. **Complete: Add login brute-force protection.** Configure a login-specific rate limit and wire failed-login tracking/lockout into authentication. Test threshold, lockout duration, and recovery behavior.
3. **Complete: Enforce password validators.** Apply Django's configured validators to registration, password change, and password reset. Added regression tests for weak-password rejection across all three flows.
4. **Pending: Revoke rotated refresh tokens.** Install and configure SimpleJWT's blacklist app, apply its migrations, and test that a rotated or logged-out refresh token cannot be reused.
5. **Pending: Harden production settings.** Require a strong production secret, disable debug, and configure HTTPS redirect, HSTS, and secure cookies without breaking local development. Verify with `manage.py check --deploy`.
6. **Pending: Harden file uploads.** Add a maximum size, validate content rather than trusting filename extensions, and remove or safely isolate active SVG uploads. Test rejected oversized and mismatched-content uploads.

## Verification Log

- Initial audit: Django deployment checks reported security configuration warnings. Runtime checks confirmed the program dashboard exposed aggregates to a member, one-character passwords passed all password serializers, and an old refresh token remained valid after rotation.
- Item 1: API smoke check passed (member `403`, admin `200`, coordinator `200`). The two focused Django tests are added, but the test runner could not create `test_bff_db` because of database permissions.
- Item 2: Runtime smoke checks passed: five failed credentials lock the account, correct credentials are denied during lockout, the 11th request from one IP is throttled with `429`, and a successful login resets the counter. `manage.py check` passes. Focused test runner remains blocked by permission denied creating `test_bff_db`.
- Item 3: Runtime API checks rejected weak passwords for registration, password change, and reset; a strong password reset succeeded. `manage.py check` passes. The three focused Django tests are added, but the test runner remains blocked by permission denied creating `test_bff_db`.