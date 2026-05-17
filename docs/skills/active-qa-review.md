# Active QA Review

Paste this content after `harness/prompts/qa.md`.
Updated by Orchestrator at the end of each completed feature.

## PR under review

- Feature ID: foundation-004
- Feature name: Hebrew seed data and import script
- Domain: foundation

## Review objective

Validate that the seed dataset and importer match foundation plan Task 4, are safe to rerun, and do not pull later tasks forward.

## Expected scope

1. `database/seed/words.csv`.
2. `database/seed/seed_words.py`.
3. State-doc updates for the completed slice.

## Must not be included in this delivery

1. Expanded word lists beyond plan scope.
2. Live database migration changes.
3. FastAPI/frontend/auth implementation.

## Mandatory checklist

1. Scope follows foundation plan Task 4 only.
2. Seed data format and row set match the plan intent.
3. Importer is idempotent and uses parameterized SQL.
4. No credentials or unrelated files are introduced.
5. `HANDOFF.md`, `STATUS.json`, `docs/progress.md`, and `docs/session-log.md` are updated consistently.
6. Applicable verification commands were executed and reported.

## Required report format

1. Verdict: `APPROVED` | `REJECTED` | `APPROVED WITH RESERVATIONS`
2. Critical problems (blocking merge)
3. Non-critical problems
4. Residual risks
5. Clear next action for Builder
