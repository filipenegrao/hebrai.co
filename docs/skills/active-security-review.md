# Active Security Review

Paste this content after `harness/prompts/security.md`.
Updated by Orchestrator at the end of each completed feature.

## PR under review

- Feature ID: foundation-008
- Feature name: Auth pages
- Domain: foundation

## Review objective

Validate that the auth UI introduces no obvious credential-handling or client-side exposure issue.

## Expected scope

1. Login/register pages.
2. Existing auth-client usage.
3. UI-only error/loading behavior.

## Must not be included in this delivery

1. Route-protection middleware review.
2. Backend auth internals.
3. Broad frontend hardening outside this diff.

## Mandatory checklist

1. No credentials or secrets are hardcoded.
2. Password handling remains client-to-auth-client only; no unsafe logging is introduced.
3. Error states do not expose sensitive implementation detail.
4. Security-relevant residual risks are documented.
5. Applicable verification commands were executed and reported.

## Required report format

1. Verdict: `CLEAN` | `ADVISORY` | `CRITICAL`
2. Critical findings (blocking merge)
3. Advisories
4. Residual risks
5. Sensors
6. Clear next action for Builder or Orchestrator
