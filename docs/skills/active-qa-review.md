# Active QA Review

Paste this content after `harness/prompts/qa.md`.
Updated by Orchestrator at the end of each completed feature.

## PR under review

- Feature ID: foundation-008
- Feature name: Auth pages
- Domain: foundation

## Review objective

Validate the login/register UI against foundation plan Task 8 without reopening later route-protection work.

## Expected scope

1. Login/register page implementation.
2. Auth-client usage.
3. State-doc updates.

## Must not be included in this delivery

1. Route-protection middleware.
2. Dashboard shell logic.
3. Backend/session features.

## Mandatory checklist

1. Scope follows foundation plan Task 8 only.
2. Pages use the auth client correctly.
3. Error/loading behavior matches the plan intent.
4. No hardcoded credentials or later-feature behavior are introduced.
5. `HANDOFF.md`, `STATUS.json`, `docs/progress.md`, and `docs/session-log.md` are updated consistently.
6. Applicable verification commands were executed and reported.

## Required report format

1. Verdict: `APPROVED` | `REJECTED` | `APPROVED WITH RESERVATIONS`
2. Critical problems (blocking merge)
3. Non-critical problems
4. Residual risks
5. Clear next action for Builder
