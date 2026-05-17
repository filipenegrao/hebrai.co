# Active QA Review

Paste this content after `harness/prompts/qa.md`.
Updated by Orchestrator at the end of each completed feature.

## PR under review

- Feature ID: foundation-003
- Feature name: PostgreSQL schema migration
- Domain: foundation

## Review objective

Validate that the initial migration matches foundation plan Task 3 and does not include later-task work.

## Expected scope

1. `database/migrations/001_initial_schema.sql`.
2. Initial schema objects from the foundation plan.
3. State-doc updates for the completed slice.

## Must not be included in this delivery

1. Seed data import work.
2. Better Auth-generated tables.
3. FastAPI or frontend implementation.

## Mandatory checklist

1. Scope follows foundation plan Task 3 only.
2. Required extension, tables, constraints, and indexes are present.
3. SQL is internally coherent and matches the plan intent.
4. No credentials or unrelated schema changes are introduced.
5. `HANDOFF.md`, `STATUS.json`, `docs/progress.md`, and `docs/session-log.md` are updated consistently.
6. Applicable verification commands were executed and reported.

## Required report format

1. Verdict: `APPROVED` | `REJECTED` | `APPROVED WITH RESERVATIONS`
2. Critical problems (blocking merge)
3. Non-critical problems
4. Residual risks
5. Clear next action for Builder
