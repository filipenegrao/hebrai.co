# Active Security Review

Paste this content after `harness/prompts/security.md`.
Updated by Orchestrator at the end of each completed feature.

## PR under review

- Feature ID: foundation-007
- Feature name: Better Auth configuration
- Domain: foundation

## Review objective

Validate that the initial auth configuration and the precondition cleanups introduce no avoidable secret-handling or dependency risk.

## Expected scope

1. Better Auth config files.
2. Removal/justification of `@better-auth/client`.
3. `shadcn` dependency-scope cleanup.
4. Frontend operational-contract linkage repair.

## Must not be included in this delivery

1. Full auth UX review.
2. Route-protection middleware review.
3. Broad deployment hardening outside this diff.

## Mandatory checklist

1. No credentials or secrets are hardcoded.
2. Auth config reads secrets from environment.
3. No unnecessary pre-alpha auth package remains unless explicitly justified.
4. Runtime dependency footprint is reduced appropriately.
5. Security-relevant residual risks are documented.
6. Applicable verification commands were executed and reported.

## Required report format

1. Verdict: `CLEAN` | `ADVISORY` | `CRITICAL`
2. Critical findings (blocking merge)
3. Advisories
4. Residual risks
5. Sensors
6. Clear next action for Builder or Orchestrator
