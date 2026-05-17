# Active Builder Task

Paste this content after `harness/prompts/builder.md`.
Updated by Orchestrator at the end of each completed feature.

## Task

- Feature ID: foundation-003
- Feature name: PostgreSQL schema migration
- Domain: foundation
- Goal: Add the initial PostgreSQL schema exactly as described in foundation plan Task 3.

## Mandatory scope

1. Create `database/migrations/001_initial_schema.sql` following `docs/superpowers/plans/2026-05-17-foundation.md` Task 3.
2. Define the planned extension, tables, constraints, and indexes for words, cards, review_log, ai_content_cache, and user_settings.
3. Preserve the plan's relationship to Better Auth users without creating later auth implementation work.
4. Update docs and state:
   - `HANDOFF.md`
   - `STATUS.json`
   - `docs/progress.md`
   - `docs/session-log.md`

## Out of scope

1. Seed data import.
2. Better Auth table generation.
3. FastAPI or Next.js implementation.
4. Running a live database migration unless tooling is available and explicitly scoped.

## Acceptance criteria

1. `database/migrations/001_initial_schema.sql` matches the foundation plan Task 3 intent.
2. The expected tables, constraints, and indexes are present.
3. No unrelated schema work is added.
4. State docs reflect the real result of this task.
5. Applicable verification commands are executed and reported.

## Constraints

1. Follow `AGENTS.md`.
2. Respect `docs/architecture.md`.
3. No scope creep.
4. No hardcoded credentials, tokens, or secrets.
