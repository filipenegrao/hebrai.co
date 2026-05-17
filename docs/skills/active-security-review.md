# Active Security Review

Paste this content after `harness/prompts/security.md`.
Updated by Orchestrator at the end of each completed feature.

## PR under review

- Feature ID: foundation-005
- Feature name: FastAPI stub
- Domain: foundation

## Review objective

Validate that the initial backend scaffold introduces no obvious exposure, secret-handling, or unsafe default issue.

## Expected scope

1. Backend dependency declaration.
2. Health-check endpoint only.
3. Container runtime definition.

## Must not be included in this delivery

1. Runtime review of future endpoints.
2. Broad Docker hardening beyond the narrow slice.
3. Public-route changes outside Task 5.

## Mandatory checklist

1. No credentials or secrets are introduced.
2. Only the intended minimal health endpoint exists.
3. Container config does not create an obvious exposure regression in reviewed scope.
4. FastAPI remains internal-only in the planned topology.
5. Security-relevant residual risks are documented.
6. Applicable verification commands were executed and reported.

## Required report format

1. Verdict: `CLEAN` | `ADVISORY` | `CRITICAL`
2. Critical findings (blocking merge)
3. Advisories
4. Residual risks
5. Sensors
6. Clear next action for Builder or Orchestrator
