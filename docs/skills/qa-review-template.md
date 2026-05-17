# QA Review Template

Use this template after pasting `harness/prompts/qa.md`.

## PR under review

- Feature ID: `{{FEATURE_ID}}`
- Feature name: `{{FEATURE_NAME}}`
- Domain: `{{DOMAIN_NAME}}`

## Review objective

Validate scope adherence, architecture compliance, quality, and safety.

## Expected scope

1. {{EXPECTED_SCOPE_1}}
2. {{EXPECTED_SCOPE_2}}
3. {{EXPECTED_SCOPE_3}}

## Must not be included in this delivery

1. {{NOT_EXPECTED_1}}
2. {{NOT_EXPECTED_2}}
3. {{NOT_EXPECTED_3}}

## Mandatory checklist

1. Dependency direction follows `docs/architecture.md`.
2. Guardrails in `AGENTS.md` are respected.
3. No hardcoded credentials, tokens, or secrets.
4. Tests cover both happy path and failure scenarios.
5. `HANDOFF.md` reflects final implementation state.
6. `STATUS.json` reflects final feature status.
7. Applicable sensors were executed and reported.

## Required report format

1. Verdict: `APPROVED` | `REJECTED` | `APPROVED WITH COMMENTS`
2. Critical issues (blocking merge)
3. Non-critical issues
4. Residual risks
5. Clear next action for Builder
