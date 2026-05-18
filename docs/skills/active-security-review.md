# Active Security Review

Paste this content after `harness/prompts/security.md`.
Updated by Orchestrator at the end of each completed feature.

## PR under review

- Feature ID: foundation-009
- Feature name: Route protection and dashboard shell
- Domain: foundation

## Review objective

Validate that route protection introduces no obvious auth-bypass or cookie-handling issue within the planned scope.

## Expected scope

1. Middleware route guard.
2. Dashboard shell behavior.
3. Planned cookie/session checks.

## Must not be included in this delivery

1. Full authorization model review.
2. Dashboard metric review.
3. Broad deployment hardening.

## Mandatory checklist

1. Protected routes are guarded as planned.
2. Public auth routes remain reachable as intended.
3. Cookie/session handling does not introduce an obvious bypass.
4. No credentials or secrets are hardcoded.
5. Security-relevant residual risks are documented.
6. Applicable verification commands were executed and reported.

## Required report format

1. Verdict: `CLEAN` | `ADVISORY` | `CRITICAL`
2. Critical findings (blocking merge)
3. Advisories
4. Residual risks
5. Sensors
6. Clear next action for Builder or Orchestrator
