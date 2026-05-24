# HANDOFF.md — Session Memory

> Updated by the agent at the end of each session.
> This file is the context bridge between different sessions.

## Last update

- **Date:** 2026-05-24
- **Session:** `dash-003` — Stats and settings proxy routes.
- **Branch / HEAD:** `main`.

## Goals completed this session

- Completed `dash-003` — Stats and settings proxy routes.
  - `frontend/src/app/api/stats/daily/route.ts`: authenticated GET proxy for `/stats/daily`. Better Auth session check → 401; proxies with `X-User-ID`; `cache: "no-store"`; 503/502 error wrapping.
  - `frontend/src/app/api/settings/route.ts`: authenticated GET + PUT proxy for `/settings`. Same auth pattern; PUT additionally wraps malformed body as 400. Both non-cached.
  - `frontend/src/lib/api.ts`: extended with `DailyStats` and `UserSettings` interfaces and `getDailyStats()`, `getSettings()`, `updateSettings()` helpers, consistent style with existing session helpers.
  - Both new routes appear as dynamic (`ƒ`) in the Next.js build route tree.
  - Sensors: ruff 4 pre-existing (none in new code); mypy 5 pre-existing (none in new code); pytest 39/39 PASS; ESLint clean; build compiled.
  - `dash-004` is unblocked.

### Carry-forward residuals (unchanged)
  - `dash-001` streak edge-case test still open.
  - `X-User-ID` is still directly trusted at the FastAPI layer — bound before external exposure.
  - Invalid stored provider/timezone can still cause 500 on backend GET until DB CHECK constraints land.

## Goals completed this session (previous)

- Completed `dash-002b` — validation hardening for settings endpoint.
  - `backend/settings_router.py`: `daily_new_limit` now bounded `ge=1, le=500` via `Field()`. `timezone` now validated via `zoneinfo.ZoneInfo` (stdlib, no new dep) + max length 64 chars. Both `@field_validator` methods run on PUT input and GET read-back (defense-in-depth).
  - `backend/tests/test_settings_router.py`: extended from 7 to 11 tests — added `daily_new_limit=0` → 422, `daily_new_limit=-1` → 422, invalid timezone → 422, overly long timezone (65 chars) → 422.
  - Mypy fix: dropped `Annotated[...]` wrapper for `Field(default=..., ge=..., le=...)` — `from __future__ import annotations` hides defaults inside `Annotated` from mypy. Plain `int = Field(...)` works correctly.
  - Sensors: backend 39/39 PASS, 0 regressions; ruff 4 pre-existing (none in new code); mypy 5 pre-existing (none in new code); frontend lint clean; frontend build compiled.
  - `dash-003` is unblocked.

### Carry-forward residuals (same as dash-002)
  - `X-User-ID` is still directly trusted at the FastAPI layer — bound before external exposure.
  - Invalid stored provider/timezone can still cause 500 on GET until DB CHECK constraints land — add before `dash-009`.
  - Provider allowlist is local to this router — keep in sync with frontend and eventual DB constraint.

## Goals completed this session (previous)

- Completed `dash-002` — Settings endpoint.
  - Created `backend/settings_router.py`: `GET /settings` and `PUT /settings`. Requires `X-User-ID` header (422 on missing). `GET` reads `preferred_provider`, `daily_new_limit`, `show_niqqud`, `timezone` from `user_settings`; returns defaults if no row. `PUT` upserts via `ON CONFLICT`. `UserSettings` Pydantic model with `field_validator` rejecting non-allowed providers (`claude`, `gpt-4o`, `gemini`, `ollama`).
  - Updated `backend/main.py`: `settings_router` registered.
  - Created `backend/tests/test_settings_router.py`: 7 tests — GET defaults, GET saved values, PUT upsert, invalid provider 422, missing header 422 (GET), missing header 422 (PUT), SQL shape regression (INSERT ON CONFLICT).
  - Note: plan test used `"openai"` provider which is not in the allowed set; corrected to `"gpt-4o"`. The field_validator runs on both input (PUT) and DB read-back (GET response), providing defense-in-depth against DB corruption.
  - Sensors: backend 35/35 PASS, 0 regressions; ruff 4 pre-existing errors (none in new code); mypy 5 pre-existing errors (none in new code); frontend lint clean; frontend build compiled.
  - Follow-on `dash-002b`: added `daily_new_limit` bound (`ge=1, le=500`), `timezone` validation (`zoneinfo.ZoneInfo` + max 64 chars), 4 new tests (39/39 PASS).

## Goals completed this session (previous)

  - Completed `dash-001` — Daily stats endpoint.
  - Created `backend/stats_router.py`: `GET /stats/daily`. Required `X-User-ID` header (422 on missing). Four metrics computed via parameterized SQL: `reviews_today`, `new_words_today`, `retention_rate` (30-day window, 0.0 if no reviews), `streak_days` (consecutive days CTE). `DailyStats` Pydantic response model.
  - Updated `backend/main.py`: `stats_router` registered.
  - Created `backend/tests/test_stats_router.py`: 3 tests — happy path, missing header 422, new user zeros.
  - Sensors: backend 28/28 PASS, 0 regressions; frontend lint clean; frontend build compiled.
  - Review closeout: QA verdict `APPROVED WITH RESERVATIONS`; Security verdict `ADVISORY`.
  - Carry-forward: docs must describe streak semantics precisely. The current SQL returns the length of the terminal consecutive run ending at the most recent review date; it does not reset to 0 merely because today has no reviews.
  - Carry-forward: add an explicit edge-case test for non-zero streak when the most recent review was yesterday before or alongside `dash-002`.
  - Carry-forward: bound `X-User-ID` length at the FastAPI layer before external exposure; confirm streak and timezone behavior against live Postgres 18 data during `dash-009`.
  - `dash-002` (settings endpoint) is unblocked.

- Completed `core-009` — End-to-end smoke test hardening.
  - **Proxy routes hardened:** `cache: "no-store"` on next-cards GET; `request.json()` wrapped → 400; upstream `fetch()` wrapped → 503; upstream `.json()` wrapped → 502. No raw internal details forwarded to browser.
  - **FASTAPI_URL default:** `docker-compose.yml` now uses `${FASTAPI_URL:-http://fastapi:8000}` — container always gets the right address even without a `.env` entry.
  - **Duplicate submission guard:** `submitting` boolean state in session page; `ratingDisabled` prop threaded through `ExerciseCard` → sub-components → `RatingBar`; buttons disabled during in-flight request.
  - **`response_time_ms` bounded:** `ge=0, le=300_000` (5 min cap) via Pydantic `Annotated[int, Field(...)]` in `backend/models.py`.
  - **AI placeholder fallback:** `generate_content()` catches `NotImplementedError` and returns deterministic stub content from the word's own data. Smoke path works without a real API key.
  - **ExerciseCard corrections:** `ratingDisabled` prop; `type="button"` on all non-submit buttons; all user-visible strings in Portuguese; unknown-format fallback card rendered.
  - **Session page:** `reviewedCount` state tracks actual reviewed cards for the completion message (vs `session_size`). `response_time_ms` client-side capped at 300 000 before submission.
  - **Backend tests:** 3 new tests for placeholder paths → 25/25 pass, 0 regressions.
  - **Stack smoke results:**
    - All 4 containers started and stayed up.
    - nginx/Next.js → 307 (proxy middleware active).
    - FastAPI `/health` → `{"status": "ok"}`.
    - PostgreSQL `COUNT(words)` → 20.
    - `FASTAPI_URL` in next container → `http://fastapi:8000` ✓
    - `GET /session/next-cards` (X-User-ID smoke-test-user-001) → 5 cards, format `multiple_choice`, placeholder AI content.
    - `POST /session/review` (card_id=1, rating=3, response_time_ms=4500) → `next_due`, `new_stability`, `new_difficulty`, `new_reps` ✓
  - **Limitation:** Better Auth tables not yet migrated — browser-level auth flow not covered in this smoke (requires `npx better-auth migrate` against a running postgres instance).
  - `core-engine` section is now `done`.

- Completed `core-008` — Session page.
  - Created `frontend/src/app/session/page.tsx`: client component with `loading` / `active` / `empty` / `complete` / `error` state machine.
  - Loads cards via `getNextCards()` on mount; handles `cards.length === 0` → `empty`.
  - Tracks per-card response time via `useRef<number>(0)` (reset to `Date.now()` inside effect/handler to satisfy `react-hooks/purity`).
  - Submits ratings via `submitReview()` with `card_id`, `rating`, `format_used`, `response_time_ms`; failures are non-fatal (session continues, card will reappear next session).
  - Renders `SessionProgress` (done / total) + `ExerciseCard` (current card) in `active` state.
  - Updated `frontend/src/app/page.tsx`: added "Iniciar sessão" link to `/session`.
  - `Button asChild` not supported by base-ui `Button` — used directly-styled `<Link>` elements throughout.
  - Sensors: `tsc --noEmit` — clean; `lint` — no issues; `build` — compiled successfully; `/session` appears as `○` (static shell) in route tree.
  - Review closeout: QA verdict `APPROVED WITH RESERVATIONS`; Security verdict `ADVISORY`.
  - `core-009` is unblocked.

- Completed `core-007` — Exercise UI components.
  - Created `frontend/src/components/RatingBar.tsx`: four FSRS rating buttons (1/Again, 2/Hard, 3/Good, 4/Easy). Props: `onRate: (rating: 1 | 2 | 3 | 4) => void`, `disabled?: boolean`. Color-coded (red/amber/blue/green) via Tailwind classes. No new dependencies.
  - Created `frontend/src/components/SessionProgress.tsx`: text and progress bar. Handles `total === 0` safely.
  - Created `frontend/src/components/ExerciseCard.tsx`: client component with three sub-renderers keyed by `card.card_id`:
    - `MultipleChoiceExercise`: Hebrew word + transliteration, shuffled options (once on mount via `useState` initializer), correctness reveal, explanation + `RatingBar`.
    - `FlashcardExercise`: Hebrew word + transliteration, reveal-on-click, gloss + example sentence + note + `RatingBar`.
    - `TypingExercise`: prompt + hint, RTL Hebrew input, Enter/button submit, correctness reveal + `RatingBar`.
  - Cleaned stale `.next/types` artifacts before sensor run — `tsc --noEmit` is now clean.
  - Sensors: `tsc --noEmit` — clean; `npm run lint` — no issues; `npm run build` — compiled successfully.
  - Review closeout: QA verdict `APPROVED`; Security verdict `CLEAN`.
  - `core-008` is unblocked.

- Completed `core-006` — HebrewWord component.
  - Created `frontend/src/components/HebrewWord.tsx`: reusable Hebrew text renderer.
  - Props: `text`, `showNiqqud` (default `true`), `size` (`sm`/`md`/`lg`/`xl`, default `"md"`), `className`.
  - Renders `<span dir="rtl" lang="he">` with Tailwind size classes (`text-xl` / `text-3xl` / `text-5xl` / `text-7xl`).
  - Internal `stripNiqqud()` removes niqqud and cantillation Unicode ranges when `showNiqqud` is false.
  - Uses `cn()` from `@/lib/utils` — no new dependencies.
  - Sensors: `lint` clean; `build` compiled successfully; `tsc --noEmit` errors are pre-existing stale `.next/types/` artifacts, not introduced by this slice.
  - Review closeout: QA verdict `APPROVED`; Security verdict `CLEAN`.
  - `core-007` is unblocked.

- Completed `core-005` — Session proxy routes.
  - Created `frontend/src/app/api/session/next-cards/route.ts`: `GET` — validates Better Auth session, forwards to FastAPI with `X-User-ID` from session, returns upstream JSON.
  - Created `frontend/src/app/api/session/review/route.ts`: `POST` — same auth pattern, forwards body + `X-User-ID` + `Content-Type` to FastAPI.
  - Created `frontend/src/lib/api.ts`: typed interfaces (`Word`, `CardWithContent`, `NextCardsResponse`, `ReviewRequest`, `ReviewResponse`) and helpers (`getNextCards()`, `submitReview()`).
  - Both routes appear in the Next.js build route tree as dynamic (`ƒ`) routes.
  - Sensors: `npm run lint` — clean. `npm run build` — compiled successfully. `BETTER_AUTH_SECRET` warning is pre-existing, not introduced by this slice.
  - Review closeout: QA verdict `APPROVED WITH RESERVATIONS`; Security verdict `ADVISORY`.
  - `core-006` is unblocked.

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

- `dash-003` complete. Next task is `dash-004` (Dashboard UI: `DashboardStats` component and full dashboard page.tsx).
- Before or alongside `dash-003`: carry-forward constraint from `dash-001` — add the missing streak edge-case test (non-zero streak when latest review was yesterday).
- Before `dash-009`: add DB CHECK constraint on `user_settings.preferred_provider` to prevent invalid stored values from causing a 500 on read-back.
- Before any external exposure: bound `X-User-ID` length at the FastAPI layer.
- Before real AI calls: wire a real provider SDK behind `_Provider` in `backend/ai_service.py`; add provider keys to `.env`.
- Before any user-facing auth: run `npx better-auth migrate` against a running postgres instance.
- `TypingExercise` answer comparison is plain `===` — a niqqud-tolerant matcher would improve UX.
- Before any external exposure of backend routes:
  - replace trusted `X-User-ID` header identity with validated session/user forwarding
  - stop echoing internal Python type names in fsrs_state validation errors
  - add an explicit body-size guard on the review POST
- Before production deployment: pass `NEXT_PUBLIC_BETTER_AUTH_URL` as a Docker build arg; add non-root user to frontend/backend Dockerfiles; multi-stage backend image.
- Guard `daily_new_limit` / preferred provider null-coalescing in `backend/session_router.py` (carried from core-004).
