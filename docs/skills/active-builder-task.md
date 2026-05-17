# Active Builder Task

Paste this content after `harness/prompts/builder.md`.
Updated by Orchestrator at the end of each completed feature.

## Task

- Feature ID: foundation-004
- Feature name: Hebrew seed data and import script
- Domain: foundation
- Goal: Add the initial Hebrew word seed dataset and import script exactly as described in foundation plan Task 4.

## Mandatory scope

1. Create `database/seed/words.csv` with the planned initial Biblical Hebrew seed list.
2. Create `database/seed/seed_words.py` following the foundation plan Task 4.
3. Keep the import idempotent using the planned `ON CONFLICT DO NOTHING` behavior.
4. Update docs and state:
   - `HANDOFF.md`
   - `STATUS.json`
   - `docs/progress.md`
   - `docs/session-log.md`

## Out of scope

1. Expanding beyond the planned initial seed list.
2. Running live imports unless tooling/runtime is available.
3. FastAPI, frontend, or auth implementation.
4. Changing the existing schema beyond what Task 4 requires.

## Acceptance criteria

1. `database/seed/words.csv` matches the foundation plan Task 4 intent.
2. `database/seed/seed_words.py` matches the planned import behavior.
3. Import logic is safe to rerun without duplicating rows.
4. State docs reflect the real result of this task.
5. Applicable verification commands are executed and reported.

## Constraints

1. Follow `AGENTS.md`.
2. Respect `docs/architecture.md`.
3. No scope creep.
4. No hardcoded credentials, tokens, or secrets.
