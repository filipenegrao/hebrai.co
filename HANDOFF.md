# HANDOFF.md — Session Memory

> Updated by the agent at the end of each session.
> This file is the context bridge between different sessions.

## Last update

- **Date:** 2026-05-18
- **Session:** Foundation section closeout after `foundation-010` QA + Security review.
- **Branch / HEAD:** `main` at `1840e83`; foundation work committed.

## Goals completed this session

- Completed `foundation-010` — Full stack smoke test.
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

- `core-001` — Backend infrastructure (FastAPI + PostgreSQL foundation for FSRS and AI services).
- Before any auth E2E testing: run `npx better-auth migrate` to create auth tables in a running postgres instance.
- Before any non-local deployment: pass `NEXT_PUBLIC_BETTER_AUTH_URL` as a Docker build arg instead of relying on the localhost fallback.
- Before real AI calls in `core-001`: ensure `.env.example` and secret-handling guidance cover `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and `GOOGLE_API_KEY`.
- During `core-001`: document that `docker-entrypoint-initdb.d` seeds only on first named-volume initialization; use `docker compose down -v` when a clean DB reset is required.
- Before enabling user-facing auth flows: map Better Auth raw errors to safe Portuguese UI messages (deferred from foundation-008/009 security advisory).
