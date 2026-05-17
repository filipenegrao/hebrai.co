# Active Builder Task

Paste this content after `harness/prompts/builder.md`.
Updated by Orchestrator at the end of each completed feature.

## Task

- Feature ID: foundation-005
- Feature name: FastAPI stub
- Domain: foundation
- Goal: Add the initial internal FastAPI service scaffold exactly as described in foundation plan Task 5.

## Mandatory scope

1. Create `backend/requirements.txt` following the foundation plan Task 5.
2. Create `backend/main.py` with the planned health-check endpoint.
3. Create `backend/Dockerfile` using the refreshed Python baseline from the plan.
4. Update docs and state:
   - `HANDOFF.md`
   - `STATUS.json`
   - `docs/progress.md`
   - `docs/session-log.md`

## Out of scope

1. Session endpoints or business logic.
2. Database access implementation.
3. Frontend or auth implementation.
4. Exposing FastAPI publicly through Nginx.

## Acceptance criteria

1. The backend files match foundation plan Task 5 intent.
2. FastAPI exposes only the planned health-check behavior.
3. The Dockerfile uses the refreshed Python baseline.
4. State docs reflect the real result of this task.
5. Applicable verification commands are executed and reported.

## Constraints

1. Follow `AGENTS.md`.
2. Respect `docs/architecture.md`.
3. No scope creep.
4. No hardcoded credentials, tokens, or secrets.
