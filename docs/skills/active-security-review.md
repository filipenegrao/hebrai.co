# Active Security Review

Paste this content after `harness/prompts/security.md`.
Updated by Orchestrator at the end of each completed feature.

## PR under review

- Feature ID: foundation-006
- Feature name: Next.js scaffold
- Domain: foundation

## Review objective

Validate that the frontend scaffold introduces no obvious secret-handling or exposure regression within the narrow scaffold scope.

## Expected scope

1. Next.js project files.
2. Tailwind/shadcn/ui config.
3. Production Dockerfile.

## Must not be included in this delivery

1. Auth/session behavior review.
2. Runtime review of future routes.
3. Broad frontend security hardening outside the scaffold diff.

## Mandatory checklist

1. No credentials or secrets are introduced.
2. No unsafe public environment values are added beyond the planned scaffold.
3. Docker/build configuration does not introduce an obvious exposure regression.
4. Security-relevant residual risks are documented.
5. Applicable verification commands were executed and reported.

## Required report format

1. Verdict: `CLEAN` | `ADVISORY` | `CRITICAL`
2. Critical findings (blocking merge)
3. Advisories
4. Residual risks
5. Sensors
6. Clear next action for Builder or Orchestrator
