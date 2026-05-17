# Active Security Review

Paste this content after `harness/prompts/security.md`.
Updated by Orchestrator at the end of each completed feature.

## PR under review

- Feature ID: foundation-003
- Feature name: PostgreSQL schema migration
- Domain: foundation

## Review objective

Validate that the initial schema introduces no obvious trust-boundary or data-protection regressions.

## Expected scope

1. Initial SQL schema for domain tables.
2. Constraints and indexes defined in the plan.
3. No live credential material.

## Must not be included in this delivery

1. Runtime auth review.
2. Seed-data review.
3. Broad review outside the migration diff.

## Mandatory checklist

1. No credentials or secrets are introduced.
2. User-scoped tables preserve explicit `user_id` boundaries where planned.
3. The migration does not introduce obvious unsafe defaults in reviewed scope.
4. Security-relevant residual risks are documented.
5. Applicable verification commands were executed and reported.

## Required report format

1. Verdict: `CLEAN` | `ADVISORY` | `CRITICAL`
2. Critical findings (blocking merge)
3. Advisories
4. Residual risks
5. Sensors
6. Clear next action for Builder or Orchestrator
