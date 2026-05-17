# Active Security Review

Paste this content after `harness/prompts/security.md`.
Updated by Orchestrator at the end of each completed feature.

## PR under review

- Feature ID: foundation-004
- Feature name: Hebrew seed data and import script
- Domain: foundation

## Review objective

Validate that the import path introduces no obvious injection, secret-handling, or unsafe automation issue.

## Expected scope

1. Seed CSV contents.
2. Python importer behavior.
3. Environment-driven DB connection use.

## Must not be included in this delivery

1. Runtime service review.
2. Broad schema redesign.
3. Review outside the Task 4 diff.

## Mandatory checklist

1. No credentials or secrets are introduced.
2. Database access uses environment configuration, not hardcoded secrets.
3. SQL execution is parameterized where user/file values are inserted.
4. Import behavior is safe to rerun.
5. Security-relevant residual risks are documented.
6. Applicable verification commands were executed and reported.

## Required report format

1. Verdict: `CLEAN` | `ADVISORY` | `CRITICAL`
2. Critical findings (blocking merge)
3. Advisories
4. Residual risks
5. Sensors
6. Clear next action for Builder or Orchestrator
