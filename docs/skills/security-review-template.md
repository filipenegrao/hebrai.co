# Security Review Template

Use this template after pasting `harness/prompts/security.md`.

## PR under review

- Feature ID: `{{FEATURE_ID}}`
- Feature name: `{{FEATURE_NAME}}`
- Domain: `{{DOMAIN_NAME}}`

## Review objective

Validate exploitable risk, trust boundaries, sensitive-data handling, and
automation safety for the current delivery.

## Expected scope

1. {{EXPECTED_SCOPE_1}}
2. {{EXPECTED_SCOPE_2}}
3. {{EXPECTED_SCOPE_3}}

## Must not be included in this delivery

1. {{NOT_EXPECTED_1}}
2. {{NOT_EXPECTED_2}}
3. {{NOT_EXPECTED_3}}

## Mandatory checklist

1. New or changed trust boundaries are identified.
2. Authentication, authorization, and tenancy assumptions are sound where applicable.
3. No hardcoded credentials, tokens, secrets, or sensitive URLs are introduced.
4. User-controlled input does not reach unsafe sinks without validation.
5. Destructive or externally visible automations preserve required safeguards.
6. Security-relevant residual risks are documented.
7. Mandatory sensors were executed and reported.

## Required report format

1. Verdict: `CLEAN` | `ADVISORY` | `CRITICAL`
2. Critical findings (blocking merge)
3. Advisories
4. Residual risks
5. Sensors
6. Clear next action for Builder or Orchestrator
