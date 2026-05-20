# HANDOFF.md — Session Memory

> Updated by the agent at the end of each session.
> This file is the context bridge between different sessions.

## Last update

- **Date:** 2026-05-19
- **Session:** `core-004` — Session router.
- **Branch / HEAD:** `main` at `25c091c`; `core-004` accepted by QA/Security, local changes ready to commit.

## Goals completed this session

- Completed `core-004` — Session router.
  - Created `backend/session_router.py`: `GET /session/next-cards` and `POST /session/review`.
  - Modified `backend/main.py`: registered `session_router` via `app.include_router`.
  - Created `backend/tests/test_session_router.py`: 7 tests (happy paths, missing header, forbidden, not-found, invalid fsrs_state type, invalid fsrs_state datetime).
  - Carry-forward constraint closed: `_validate_fsrs_state()` in the router validates type and ISO datetime fields before `fsrs_state_to_card()` is called; returns 422 with a coherent message on failure.
  - Full suite: **22/22 PASS, 0 regressions**.
  - Review closeout: QA verdict `APPROVED WITH RESERVATIONS`; Security verdict `ADVISORY`.
  - `core-005` is unblocked.

- Pre-`core-004` hardening (all carry-forward constraints from `core-003` review closed):
  - `backend/models.py`: `ReviewRequest.format_used` → `Literal["multiple_choice", "flashcard", "typing"]`.
  - `backend/ai_service.py`: `_build_prompt()` now raises `ValueError` for unknown formats instead of silently falling through to typing template. `generate_content()` wraps `json.loads` and converts `JSONDecodeError` to a structured `ValueError`. Added docstring on provider response shape; added comment on `Word` field trust assumption.
  - `backend/db.py`: `_get_pool()` now uses a double-checked lock (`threading.Lock`) to prevent concurrent threads from creating multiple connection pool instances.
  - `backend/tests/test_ai_service.py`: added `test_build_prompt_raises_for_unknown_format` and `test_generate_content_raises_on_malformed_json`.
  - Full suite: **15/15 PASS, 0 regressions**.

- Completed `core-003` — AI content generation service.
  - Created `backend/ai_service.py`: `hash_prompt`, `_build_prompt`, `generate_content`. Provider boundary kept internal via a `_Provider` placeholder with a `.generate()` interface (real SDK wrappers deferred to when they're first needed).
  - Created `backend/tests/test_ai_service.py`: 5 tests covering deterministic hash, format-discriminated hash, and all three exercise formats with mocked provider responses.
  - Applied carry-forward constraints from `core-001`/`core-002` reviews:
    - `backend/models.py`: `CardWithContent.format` → `Literal["multiple_choice", "flashcard", "typing"]`; `ReviewRequest.rating` → `Literal[1, 2, 3, 4]`.
    - `backend/fsrs_service.py`: `fsrs_state_to_card()` now uses explicit `"key" in state` guards instead of unconditional `.get()` assignment, preventing partial state dicts from overwriting FSRS defaults with `None`.
  - No dependencies added (no real provider SDK in this slice).
  - Sensors: red→green TDD cycle in Docker. Full suite 13/13 PASS, 0 regressions.

- **Review closeout for `core-003`:**
  - QA verdict: `APPROVED WITH RESERVATIONS`
  - Security verdict: `ADVISORY`
  - Carry-forward constraints:
    - Before `core-004`: constrain `ReviewRequest.format_used` to `Literal["multiple_choice", "flashcard", "typing"]`.
    - Before `core-004`: make `_build_prompt()` raise `ValueError` for unknown `exercise_format` instead of falling through to typing.
    - Before `core-004`: wrap provider-response JSON parsing in structured error handling.
    - Before `core-004`: make `_get_pool()` thread-safe and validate `fsrs_state` shape before datetime parsing.
    - Before or alongside real SDK wiring: document the trusted-source assumption for `Word` prompt fields and validate `DEFAULT_AI_MODEL` against an explicit provider contract or allowlist.

- Completed `core-002` — FSRS scheduling service.
  - Created `backend/fsrs_service.py`: `fsrs_state_to_card`, `card_to_fsrs_state`, `schedule_review`, `determine_format`.
  - Created `backend/tests/test_fsrs_service.py`: 8 tests covering all acceptance criteria.
  - Added `fsrs==6.3.1` to `backend/requirements.txt` (package name is `fsrs`, not `py-fsrs`).
  - **API note:** `fsrs` v6 has no `reps` field. We carry `reps` as a synthetic counter in our state dict (incremented by `schedule_review`) and set it as a dynamic attribute on the `Card` dataclass (no `__slots__`).
  - Sensors: red→green TDD cycle confirmed in Docker. All 8 tests PASS. Full suite 8/8, 0 regressions.

- **Review closeout for `core-002`:**
  - QA verdict: `APPROVED WITH RESERVATIONS`
  - Security verdict: `ADVISORY`
  - Carry-forward constraints:
    - Before `core-003`: constrain `CardWithContent.format` and `ReviewRequest.rating` in `backend/models.py`.
    - Before `core-003` leaves QA: guard `fsrs_state_to_card()` so missing keys do not overwrite FSRS defaults with `None`.
    - Before `core-004`: make `_get_pool()` thread-safe, ensure invalid `rating` cannot reach `_RATING_MAP[rating]` as an unhandled `KeyError`, and validate `fsrs_state` shape before `datetime.fromisoformat()` sees untrusted values.

- Security hardening follow-up after `core-001`: created `backend/.dockerignore`.
  - Excludes `.env`, `.env.*`, `__pycache__/`, `*.pyc`, `*.pyo`, `*.pyd`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`, `*.egg-info/`, `dist/`, `build/`, `.DS_Store`, `*.swp`, `*.swo`.
  - Docker build re-verified: PASS.

- Completed `core-001` — Backend infrastructure.
  - Created `backend/db.py`: psycopg2 `ThreadedConnectionPool`, FastAPI `db_connection` dependency (commit/rollback/putconn lifecycle).
  - Created `backend/models.py`: `Word`, `CardWithContent`, `NextCardsResponse`, `ReviewRequest`, `ReviewResponse` — pure Pydantic contracts.
  - Updated `backend/requirements.txt`: added `psycopg2-binary==2.9.10`, `pytest==8.3.4`, `httpx==0.28.1`, `pytest-mock==3.14.0`.
  - Created `backend/tests/__init__.py` (empty) and `backend/tests/conftest.py` (`mock_db` + `client` fixtures with `app.dependency_overrides`).
  - Updated `backend/Dockerfile`: added `build-essential` + `libpq-dev` so psycopg2-binary compiles from source on Python 3.14-slim (no pre-built wheel exists for this runtime).

- **Sensors run:**
  - Docker image build: PASS.
  - Import smoke test inside container (`db_connection`, all Pydantic models): PASS.
  - `pytest tests/`: exit 5 — 0 tests collected (conftest-only; no test files added in this slice — expected).

- **Review closeout for `core-001`:**
  - QA verdict: `APPROVED WITH RESERVATIONS`
  - Security verdict: `ADVISORY`
  - Follow-up constraints carried forward:
    - Before `core-003`: constrain `CardWithContent.format` and `ReviewRequest.rating`.
    - Before `core-004`: add a lock guard around lazy `_get_pool()` initialization.
    - Pre-production hardening: multi-stage backend Dockerfile, non-root user, explicit `DATABASE_URL` validation, direct `pydantic` pin.

- **Review closeout for `.dockerignore` hardening:**
  - QA verdict: `APPROVED`
  - Security verdict: `CLEAN`
  - The build-context secret-exposure advisory from `core-001` is closed.

- Completed `foundation-010` — Full stack smoke test (carried from previous session).
  - Created `database/migrations/002_seed_words.sql` — 20 Biblical Hebrew words as SQL INSERT, auto-seeded via postgres `initdb.d` on first boot. The seed Python script cannot connect to postgres (internal-only network); SQL migration is the only viable path for automatic seeding in Docker Compose.
  - Fixed `docker-compose.yml`: postgres:18 changed the expected volume mount path from `/var/lib/postgresql/data` to `/var/lib/postgresql` (major-version-specific data dirs; see https://github.com/docker-library/postgres/pull/1259). Container crashed with `restart` loop without this fix.
  - Ran `docker compose build` — both `hebraico-fastapi` and `hebraico-next` built cleanly.
  - Ran `docker compose up -d` — all four services (postgres, fastapi, next, nginx) came up and stayed up.

- **Smoke test results (verified live):**
  - nginx/Next.js at `http://localhost:80` → `307` (proxy redirecting unauthenticated request to `/login` — proxy.ts middleware is active)
  - FastAPI `/health` (from inside container via Python urllib) → `{"status":"ok"}`
  - PostgreSQL `SELECT COUNT(*) FROM words` → `count = 20`
  - All containers torn down cleanly with `docker compose down`.

- **Sensors run:**
  - `npm run lint` — clean.
  - `npm run build` — compiled successfully; route tree unchanged; build still shows `ƒ Proxy (Middleware)` confirming proxy.ts is wired.

- **proxy.ts finding confirmed:** The 307 response at `localhost:80` proves proxy.ts is running as middleware in Next.js 16. The build's `ƒ Proxy (Middleware)` line is consistent with this.

- **NEXT_PUBLIC_BETTER_AUTH_URL at build time:** This env var is NOT passed as a Docker build arg in `docker-compose.yml`, so `http://localhost:3000` is baked in via the fallback in `auth-client.ts`. For production, this needs a `build.args` entry in `docker-compose.yml`. Non-blocking for smoke test.

- **Better Auth error-message follow-up:** DEFERRED. The smoke test does not exercise any auth flow. Running auth login/register would also require Better Auth tables (`npx better-auth migrate`) to exist in the DB first. This follow-up belongs in `core-001` or a dedicated pre-`core-001` task.

- **Docker binary note:** On this machine, `/usr/local/bin/docker` is a broken symlink (AppTranslocation). Docker must be invoked with the full path `/Applications/Docker.app/Contents/Resources/bin/docker` and `PATH` set to include that directory so `docker-credential-desktop` resolves.

- **Review closeout:**
  - QA verdict for `foundation-010`: `APPROVED`
  - Security verdict for `foundation-010`: `ADVISORY`
  - Foundation section (`foundation-001` through `foundation-010`) is now closed and committed.

## WIP (in-progress at handoff)

- None.

## Suggested next steps

- `core-005` — Session proxy routes (Next.js API routes + `frontend/src/lib/api.ts`).
- Carry forward from `core-004` into the next suitable hardening point:
  - guard `daily_new_limit` / preferred provider null-coalescing in `backend/session_router.py`
  - catch invalid DB `format_override` and return a structured error instead of a bare 500
  - constrain `ReviewRequest.response_time_ms`
- Before any external exposure of backend routes:
  - replace trusted `X-User-ID` header identity with validated session/user forwarding
  - stop echoing internal Python type names in fsrs_state validation errors
- Before real AI calls land: add at least one real provider SDK wrapper behind `_Provider`; add `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY` to `.env.example`.
- Before any auth E2E testing: run `npx better-auth migrate` to create auth tables in a running postgres instance.
- Before any non-local deployment: pass `NEXT_PUBLIC_BETTER_AUTH_URL` as a Docker build arg instead of relying on the localhost fallback.
- During backend Docker hardening: add `.venv/`, `venv/`, and `htmlcov/` to `backend/.dockerignore`, and later remove test files from the final runtime stage once a multi-stage image exists.
- Before enabling user-facing auth flows: map Better Auth raw errors to safe Portuguese UI messages (deferred from foundation-008/009 security advisory).
