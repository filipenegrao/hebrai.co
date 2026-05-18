# Active QA Review

Paste this content after `harness/prompts/qa.md`.
Updated by Orchestrator at the end of each completed feature.

## PR under review

- Feature ID: foundation-009
- Feature name: Route protection and dashboard shell
- Domain: foundation

## Review objective

Validate route protection and the initial dashboard shell against foundation plan Task 9.

## Expected scope

1. Middleware / route protection.
2. Root dashboard shell page.
3. State-doc updates.

## Must not be included in this delivery

1. Real dashboard metrics.
2. Core-engine/session logic.
3. Deployment work.

## Mandatory checklist

1. Scope follows foundation plan Task 9 only.
2. Middleware protects the intended routes and preserves `/login` access.
3. Dashboard shell matches the plan intent.
4. No hardcoded secrets or later-feature behavior are introduced.
5. `HANDOFF.md`, `STATUS.json`, `docs/progress.md`, and `docs/session-log.md` are updated consistently.
6. Applicable verification commands were executed and reported.

## Required report format

1. Verdict: `APPROVED` | `REJECTED` | `APPROVED WITH RESERVATIONS`
2. Critical problems (blocking merge)
3. Non-critical problems
4. Residual risks
5. Clear next action for Builder
