# Active QA Review

Paste this content after `harness/prompts/qa.md`.
Updated by Orchestrator at the end of each completed feature.

## PR under review

- Feature ID: foundation-005
- Feature name: FastAPI stub
- Domain: foundation

## Review objective

Validate that the initial FastAPI scaffold matches foundation plan Task 5 and stays intentionally minimal.

## Expected scope

1. `backend/requirements.txt`.
2. `backend/main.py`.
3. `backend/Dockerfile`.
4. State-doc updates for the completed slice.

## Must not be included in this delivery

1. Session/business endpoints.
2. Database access implementation.
3. Frontend/auth work.
4. Public FastAPI exposure.

## Mandatory checklist

1. Scope follows foundation plan Task 5 only.
2. Requirements match the plan intent.
3. `GET /health` behavior is correct and minimal.
4. Dockerfile matches the refreshed baseline and expected run command.
5. No credentials or unrelated files are introduced.
6. `HANDOFF.md`, `STATUS.json`, `docs/progress.md`, and `docs/session-log.md` are updated consistently.
7. Applicable verification commands were executed and reported.

## Required report format

1. Verdict: `APPROVED` | `REJECTED` | `APPROVED WITH RESERVATIONS`
2. Critical problems (blocking merge)
3. Non-critical problems
4. Residual risks
5. Clear next action for Builder
