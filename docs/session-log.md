# Session log

Append-only dated notes. Use [`HANDOFF.md`](../HANDOFF.md) for the **current** snapshot between sessions.

## 2026-04-29 — Goals 7 & 8: npm CLI + dashboard usage telemetry

### What was done

**Goal 7 — `start-harness` npm CLI**
- Added `start-harness-project/cli/` — zero-runtime-dep npm package
- `bin/index.js`: Python 3.12+ guard (stdout+stderr combined), delegates to bundled `init_project.py`
- `scripts/bundle.js`: copies scaffold assets; generates blank HANDOFF.md; removes user-notes.md (prevents session state from leaking into published template)
- `cli/README.md`: install, usage, stacks table, dev instructions
- `start-harness-project/README.md`: Quick start now shows Option A (npm) + Option B (python3 direct)
- `.github/workflows/publish-cli.yml`: publishes to npmjs.com on `v*` tags using `NODE_AUTH_TOKEN` secret

**Goal 8 — Dashboard usage telemetry + UI polish**
- `lib/db.ts`: `usage_events` table, `session_start` column with migration guard, `UsageEvent` type
- `lib/types.ts`: 23-entry `MODEL_LABELS` (Claude, OpenAI, Qwen, Gemini families), `session_start` on `PipelineRun`
- `app/api/events/route.ts`: sets `session_start` on planning events; pushes full run + last 10 transitions inline in SSE (single round-trip)
- `hooks/usePipeline.ts`: merges SSE payload with explicit `merged` flag; fallback to full GET on malformed payload
- `app/api/usage/route.ts`: POST stores telemetry (fallback to most recent active run); GET returns events + totals
- `components/RunCard.tsx`: client component with click-to-expand (full title, all transitions, progress %, session start)
- `components/StatusBar.tsx`: live bar showing model, input/output tokens, session elapsed, task %
- `app/api/status-json/route.ts`: reads `STATUS.json` (`$HARNESS_STATUS_JSON` env or `<cwd>/STATUS.json`)
- `scripts/usage-event.sh`: core POST to `/api/usage`
- `scripts/claude-usage-hook.sh`: Claude Code PostToolUse hook
- `scripts/codex-usage-adapter.sh` / `opencode-usage-adapter.sh`: CLI wrappers with JSON usage parsing

**PR:** https://github.com/filipenegrao/combo-harness/pull/4 (`pr/6-dashboard-integration` → `main`)

### Decisions

- `bundle.js` generates a blank HANDOFF.md instead of copying the live one — prevents session state from shipping with the npm package
- `usePipeline.ts` fallback uses explicit `merged = false` flag (not implicit fallthrough) — QA required this for clarity
- Codex/OpenCode adapters use `export SCRIPT_DIR` before heredoc + `os.environ.get("SCRIPT_DIR")` inside Python — `sys.argv[0]` resolves to `-` in heredoc context
- `set +e` around pipe in adapters to capture `PIPESTATUS[0]` before `set -e` terminates on nonzero exit
- `STATUS.json` task %: computed in JS via reduce, not SQL — keeps DB schema simple
- SSE single round-trip: `POST /api/events` now fetches and pushes `{ run, transitions }` inline to avoid a separate client GET

### Follow-ups

- Tag `v0.1.0` to trigger npm publish: `git tag v0.1.0 && git push origin v0.1.0`
- Register `claude-usage-hook.sh` in `~/.claude/settings.json` PostToolUse hooks
- Symlink `~/.claude/hooks/usage-event.sh` → `agents-dashboard/scripts/usage-event.sh`
- Document new scripts in `agents-dashboard/README.md`

## YYYY-MM-DD — Title

### What was done

### Decisions

### Follow-ups

## 2026-05-17 — Add Security review lane to harness workflow

### What was done

- Added `harness/prompts/security.md` for independent security review.
- Expanded `harness/prompts/orchestrator.md` from Builder -> QA to Builder -> QA -> Security.
- Added `docs/skills/security-review-template.md` and `docs/skills/active-security-review.md`.
- Updated `docs/skills/README.md`, `docs/skills/active-orchestrator-session.md`, `docs/dashboard-integration.md`, and `AGENTS.md` to reflect the new Security lane.

### Decisions

- Security review is a separate independent stage after QA approval.
- Security verdicts use `CLEAN | ADVISORY | CRITICAL`, so only critical findings loop back to Builder.
- Dashboard observability now includes `sent_to_security` and `security_reviewing`.

### Follow-ups

- Replace the scaffolded root project docs with hebrai.co-specific context from `docs/superpowers/plans/`.
- Initialize the repository before beginning implementation work.

## 2026-05-17 — Rebase harness docs onto hebrai.co plans

### What was done

- Replaced the placeholder `CLAUDE.md` with real project context for hebrai.co.
- Rewrote `STATUS.json` around the three live delivery tracks: `foundation`, `core-engine`, and `dashboard-deploy`.
- Replaced the generic architecture and progress docs with hebrai.co-specific versions.
- Rotated active Builder, QA, and Security docs to `foundation-001` — Project scaffold.
- Updated active/template docs to reference `docs/architecture.md` consistently.

### Decisions

- The three files in `docs/superpowers/plans/` are now treated as the implementation source of truth.
- The first atomic delivery slice is `foundation-001`, corresponding to foundation plan Task 1.
- Later plan tasks remain tracked but pending until the initial scaffold exists.

### Follow-ups

- Initialize git and implement `foundation-001` through the Builder -> QA -> Security cycle.

## 2026-05-17 — Refresh planned stack versions

### What was done

- Updated the foundation plan to current stable baselines: Next.js 16.2, Tailwind CSS 4.3, PostgreSQL 18, Python 3.14, Better Auth 1.6.9, FastAPI 0.128.5, and `nginx:stable-alpine`.
- Updated the downstream core-engine and dashboard/deploy plans so they inherit the same refreshed baseline.
- Updated `CLAUDE.md` and the active Builder packet to match the refreshed stack assumptions.

### Decisions

- New work should start on current stable releases as of 2026-05-17 unless a compatibility blocker appears.
- Dependency manifests should use explicit version pins where the plan introduces dependencies.
- Container references should prefer explicit stable tags over floating generic tags.

### Follow-ups

- Use the refreshed stack versions when implementing `foundation-001`.

## 2026-05-17 — foundation-001: Project scaffold

### What was done

- Initialized git repository at the project root.
- Created `.gitignore` with rules for Node, Python, Docker, OS, Superpowers, and database artifacts — matching foundation plan Task 1 Step 2 exactly.
- Created `.env.example` with PostgreSQL, Better Auth, AI provider, and FastAPI environment variables — matching foundation plan Task 1 Step 3.
- Created `docker-compose.yml` with four services (`postgres:18-alpine`, `fastapi`, `next`, `nginx:stable-alpine`), two networks (`internal`, `external`), and `postgres_data` volume — matching foundation plan Task 1 Step 4 exactly.
- Created directory structure: `nginx/`, `database/migrations/`, `database/seed/`, `backend/`, `frontend/`.
- Updated `HANDOFF.md`, `STATUS.json`, `docs/progress.md`, and `docs/session-log.md`.

### Decisions

- `NEXT_PUBLIC_BETTER_AUTH_URL` was added to `.env.example` from the plan even though it's not explicitly in Task 1 Step 3 — it's required by the Better Auth client config in Task 7 and avoids a missing-var gap.
- No application sensors were run because no application code exists yet. Docker CLI was unavailable on this machine; `docker-compose.yml` was manually compared against the foundation plan Task 1 Step 4 template instead of being validated with `docker compose config`.
- Git commit was NOT performed — the plan Step 5 says `git commit` but the project AGENTS.md rules say "NEVER commit changes unless the user explicitly asks you to." This is documented as residual risk.

### Follow-ups

- Commit the scaffold files when instructed.
- Proceed to `foundation-002` — Nginx config.

## 2026-05-17 — foundation-001 closeout

### What was done

- Processed QA verdict `APPROVED WITH RESERVATIONS` for `foundation-001`.
- Applied the two required corrections before closeout:
  - added `.claude/` to `.gitignore`
  - corrected `docs/session-log.md` so it no longer claims `docker compose config` ran
- Kept `NEXT_PUBLIC_BETTER_AUTH_URL` in `.env.example` and documented it in `STATUS.json` as an intentional early placeholder for Task 7.
- Processed Security verdict `ADVISORY` with no critical findings.
- Rotated active Builder, QA, Security, and Orchestrator files to `foundation-002`.

### Decisions

- `foundation-001` is considered complete with non-blocking security advisories tracked for later work.
- Security advisories to carry forward:
  - add runtime validation that rejects placeholder secrets
  - consider broader env-file ignore coverage before deployment-focused tasks

### Follow-ups

- Begin `foundation-002` — Nginx config.
- Make the initial commit only when the user explicitly requests it.

## 2026-05-17 — foundation-002: Nginx config

### What was done

- Created `nginx/nginx.conf` with reverse-proxy configuration matching foundation plan Task 2 exactly.
- Nginx listens on port 80; proxies all `/` traffic to `http://next:3000`.
- Includes proxy headers: `Upgrade`, `Connection`, `Host`, `X-Real-IP`, `proxy_cache_bypass`.
- FastAPI (`fastapi:8000`) is not exposed via Nginx — internal-only as per architecture.
- Updated `HANDOFF.md`, `STATUS.json`, `docs/progress.md`, and `docs/session-log.md`.

### Decisions

- No `server_name` changes — kept `hebrai.co www.hebrai.co` from the plan.
- No HTTPS/443 listener configuration beyond the port mapping already in `docker-compose.yml` — TLS configuration belongs to the later dashboard/deploy plan.
- Docker/Nginx tooling unavailable locally — verification done via file content checks (grep) rather than `nginx -t`.

### Follow-ups

- Proceed to `foundation-003` — PostgreSQL schema migration.
- Make the initial git commit when explicitly requested.

## 2026-05-17 — foundation-002 closeout

### What was done

- Processed QA verdict `APPROVED` for `foundation-002`.
- Processed Security verdict `CLEAN` for `foundation-002`.
- Confirmed the initial reverse-proxy config preserves the planned boundary: public traffic reaches `next`, not `fastapi`.
- Rotated active Builder, QA, Security, and Orchestrator files to `foundation-003`.

### Decisions

- Runtime Nginx syntax validation remains a residual risk until tooling is available; it is not a blocker because the delivered file matches the plan exactly.
- HTTPS/TLS hardening remains intentionally deferred to the later deployment plan.

### Follow-ups

- Begin `foundation-003` — PostgreSQL schema migration.

## 2026-05-17 — foundation-003: PostgreSQL schema migration

### What was done

- Created `database/migrations/001_initial_schema.sql` with the 5 application tables specified in foundation plan Task 3.
- Tables created: `words`, `cards`, `review_log`, `ai_content_cache`, `user_settings`.
- Constraints included: `UNIQUE (user_id, word_id)` on cards, `UNIQUE (word_id, provider, prompt_hash)` on ai_content_cache, `CHECK` on rating (1-4) and format_override, `REFERENCES` with `ON DELETE CASCADE`.
- Indexes added: `idx_cards_user_due` (expression index on fsrs_state->>'due'), `idx_review_log_card`, `idx_ai_cache_lookup`.
- Better Auth table management left to Better Auth's own migration system — referenced via comments only.
- Updated `HANDOFF.md`, `STATUS.json`, `docs/progress.md`, and `docs/session-log.md`.

### Decisions

- SQL syntax was not validated against a live PostgreSQL instance — Docker/psql tooling unavailable locally. The file was written verbatim from the plan template.
- Better Auth tables (`users`, `sessions`, `accounts`, `verifications`) are intentionally excluded — they are managed by `npx better-auth migrate` in Task 7.

### Follow-ups

- Proceed to `foundation-004` — Hebrew seed data and import script.
- Validate the migration against a live PostgreSQL instance when the full stack boots in Task 10.
- Make the initial git commit when explicitly requested.

## 2026-05-17 — foundation-003 closeout

### What was done

- Processed QA verdict `APPROVED` for `foundation-003`.
- Processed Security verdict `ADVISORY` for `foundation-003`.
- Recorded the schema hardening notes surfaced during review instead of losing them after approval.
- Rotated active Builder, QA, Security, and Orchestrator files to `foundation-004`.

### Decisions

- The initial migration is acceptable as the foundation baseline.
- Carry forward these non-blocking follow-ups:
  - enforce `review_log.user_id` consistency with `cards.user_id`
  - define cleanup behavior for soft Better Auth user references
  - verify FSRS due serialization format before relying on the JSONB expression index
  - later decide provider allowlist and AI cache expiry policy

### Follow-ups

- Begin `foundation-004` — Hebrew seed data and import script.

## 2026-05-17 — foundation-004: Hebrew seed data and import script

### What was done

- Created `database/seed/words.csv` with the top-20 Biblical Hebrew frequency list, matching foundation plan Task 4 Step 1 exactly.
- Created `database/seed/seed_words.py` — a Python script that reads UTF-8 CSV and inserts into the PostgreSQL `words` table.
- Importer uses: `DATABASE_URL` from environment, parameterized (`%s`) queries, `ON CONFLICT DO NOTHING` for idempotent reruns.
- Reports `{inserted} inserted, {skipped} skipped` after completion.
- Updated `HANDOFF.md`, `STATUS.json`, `docs/progress.md`, and `docs/session-log.md`.

### Decisions

- Live import was not executed — Docker/psql tooling unavailable locally. The scripts were written verbatim from the plan.
- The import script dynamically loads `morphology` from the CSV as JSON for extensibility beyond the initial top-20 list.

### Follow-ups

- Proceed to `foundation-005` — FastAPI stub.
- Run the live import when PostgreSQL is available (Task 10 full stack smoke test).
- Replace the top-20 seed list with the full frequency corpus before production launch.

## 2026-05-17 — foundation-004 QA correction pass

### What was done

- QA verdict: `REJECTED` — importer was not genuinely idempotent.
- **Fix 1 (blocking):** Added `UNIQUE` constraint to `words.hebrew` in `001_initial_schema.sql`.
- **Fix 2 (blocking):** Changed `ON CONFLICT DO NOTHING` to `ON CONFLICT (hebrew) DO NOTHING` in `seed_words.py`.
- **Recommended improvement:** Fixed `אֶרֶץ` gloss from duplicated `terra / terra` to `terra / país` in `words.csv`.
- **Recommended improvement:** Default CSV path now uses `os.path.dirname(os.path.abspath(__file__))` so it resolves relative to the script location regardless of caller cwd.
- **Recommended improvement:** Wrapped connection/cursor lifecycle in `try/finally` for proper cleanup on failure.
- Updated `HANDOFF.md`, `STATUS.json`, and `docs/session-log.md`.

### Decisions

- All three recommended QA notes applied — each was a single-line or minimal-scope change.
- Schema change (`UNIQUE` on `hebrew`) is safe because no live database has been seeded yet.

### Follow-ups

- Resubmit to QA for re-evaluation.
- Proceed to `foundation-005` — FastAPI stub.

## 2026-05-17 — foundation-004 closeout

### What was done

- Processed initial QA verdict `REJECTED` for `foundation-004`.
- Corrected the broken idempotency contract by adding `UNIQUE` to `words.hebrew` and changing the importer to `ON CONFLICT (hebrew) DO NOTHING`.
- Applied the recommended local improvements: fixed the duplicated `אֶרֶץ` gloss, made the default CSV path script-relative, and added explicit cleanup.
- Processed QA recheck verdict `APPROVED`.
- Processed Security verdict `CLEAN`.
- Rotated active Builder, QA, Security, and Orchestrator files to `foundation-005`.

### Decisions

- The seed importer is only considered idempotent when schema and conflict target agree.
- Live import validation remains deferred until PostgreSQL tooling is available.

### Follow-ups

- Begin `foundation-005` — FastAPI stub.

## 2026-05-17 — Switch AI strategy to direct provider SDKs

### What was done

- Replaced the planned LiteLLM abstraction with direct provider SDKs behind an internal adapter boundary.
- Added `docs/decisions/ADR-001-ai-provider-boundary.md` documenting the decision.
- Kept the backend baseline on Python 3.14 because the official OpenAI, Anthropic, and Google Gen AI SDKs currently support it.
- Tightened foundation Task 5 to remain a true health-check stub with only the dependencies it uses.

### Decisions

- Initial AI architecture will use our own adapter boundary rather than LiteLLM.
- Provider SDKs will be introduced only in the core-engine slice that first needs them.
- A richer abstraction can be revisited later if the AI layer grows materially more complex.

### Follow-ups

- Refresh the core-engine Task 3 implementation details around the internal adapter before executing that task.

## 2026-05-17 — foundation-005: FastAPI stub

### What was done

- Created `backend/requirements.txt` with `fastapi==0.136.1` and `uvicorn[standard]==0.46.0` only.
- Created `backend/main.py` with the `/health` endpoint returning `{"status": "ok"}`.
- Created `backend/Dockerfile` using `python:3.14-slim`, exposing port 8000.
- Updated `HANDOFF.md`, `STATUS.json`, `docs/progress.md`, and `docs/session-log.md`.

### Decisions

- Requirements are intentionally minimal — only the 2 dependencies needed for the health-check stub. psycopg2, LiteLLM, py-fsrs, and python-dotenv are deferred until their respective features.
- LiteLLM is permanently excluded from the default architecture per ADR-001 (direct provider SDKs behind internal adapter).
- Docker build and runtime were not validated — Docker CLI unavailable locally. Files match the plan template.

### Follow-ups

- Proceed to `foundation-006` — Next.js scaffold.
- Validate the FastAPI container build when Docker tooling becomes available.

## 2026-05-17 — foundation-005 closeout

### What was done

- Processed QA verdict `APPROVED` for `foundation-005`.
- Processed Security verdict `CLEAN` for `foundation-005`.
- Confirmed the backend stub stayed intentionally minimal after ADR-001: FastAPI + Uvicorn only, with a single `/health` route.
- Rotated active Builder, QA, Security, and Orchestrator files to `foundation-006`.

### Decisions

- Keep the health-check stub lean; provider SDKs, DB drivers, and FSRS should arrive only when later features first need them.
- Container runtime validation remains deferred until Docker tooling is available.

### Follow-ups

- Begin `foundation-006` — Next.js scaffold.


## 2026-05-18 — Refresh frontend runtime baseline

### What was done

- Updated the planned frontend container baseline from Node.js 20 to Node.js 24 LTS before starting `foundation-006`.
- Kept Next.js 16.2 unchanged; Node.js 24 satisfies the current Next.js 16 minimum and avoids starting on an EOL runtime.

### Decisions

- New frontend work should target Node.js 24 LTS rather than Node.js 20, which is already end-of-life.

### Follow-ups

- Use `node:24-alpine` in the `foundation-006` frontend Dockerfile.

## 2026-05-18 — foundation-006: Next.js scaffold

### What was done

- Scaffolded Next.js 16.2.6 with `create-next-app` (TypeScript, Tailwind CSS 4, ESLint, App Router, src dir, turbopack).
- Installed Better Auth 1.6.11, `@better-auth/client`, `pg` 8.20.0, `@types/pg` 8.20.0.
- Initialized shadcn/ui 4.7.0 with Tailwind v4 compat; added `button`, `card`, `input`, `label` components.
- Created `frontend/Dockerfile` (multi-stage) with `node:24-alpine` in all three stages (deps, builder, runner).
- Set `output: "standalone"` in `next.config.ts`.
- Verified `npm run build` (Next.js 16.2.6 + Turbopack — compiled successfully) and `npm run lint` (ESLint — no output, clean).
- Updated `HANDOFF.md`, `STATUS.json`, `docs/progress.md`, and `docs/session-log.md`.

### Decisions

- Used Node.js 24 LTS (`node:24-alpine`) instead of the plan's Node.js 20 — Node 20 is EOL as of March 2026 and 24 is the current LTS.
- `create-next-app` used `--turbopack` flag; the scaffold includes turbopack for dev.
- Tailwind v4 uses `@import "tailwindcss"` and `@theme inline` — the plan's `tailwind.config.ts` reference is not applicable for v4 (config is CSS-based).
- No auth or route protection code pulled forward — pure scaffold.

### Follow-ups

- Proceed to `foundation-007` — Better Auth configuration.
- Consider cleaning the generated AGENTS.md and CLAUDE.md from the frontend subdir if they conflict with root project docs.

## 2026-05-18 — foundation-006 closeout

### What was done

- Processed QA verdict `APPROVED WITH RESERVATIONS` for `foundation-006`.
- Processed Security verdict `ADVISORY` for `foundation-006`.
- Preserved the scaffold review follow-ups as explicit preconditions for `foundation-007` instead of leaving them as loose notes.
- Rotated active Builder, QA, Security, and Orchestrator files to `foundation-007`.

### Decisions

- `foundation-006` is acceptable to close, but these items must be resolved before Task 7 completion:
  - remove or explicitly justify `@better-auth/client`
  - move `shadcn` to `devDependencies`
  - repair `frontend/CLAUDE.md` root-contract linkage
- Add a non-root frontend runtime user before the first deployment-facing milestone.

### Follow-ups

- Begin `foundation-007` — Better Auth configuration.

## 2026-05-18 — foundation-007: Better Auth configuration

### What was done

**Preconditions resolved:**
1. Removed `@better-auth/client` (v0.0.2-alpha.3 — pre-alpha). `better-auth` v1.6.11 exports a stable `./client` subpath (`node_modules/better-auth/client/index.mjs`), making the separate package redundant. 12 transitive packages cleaned.
2. Moved `shadcn` (v4.7.0) from `dependencies` to `devDependencies` — it is a CLI tool, not a runtime dependency.
3. Rewrote `frontend/CLAUDE.md`: now references `@../../AGENTS.md` and instructs agents to consult `node_modules/next/dist/docs/` for Next.js 16 API changes.

**Better Auth files created:**
- `frontend/src/lib/auth.ts` — server config: PostgreSQL pool via `DATABASE_URL`, email/password enabled, `trustedOrigins` from `BETTER_AUTH_URL`.
- `frontend/src/lib/auth-client.ts` — browser client using `better-auth/client` (stable subpath, not pre-alpha package).
- `frontend/src/app/api/auth/[...all]/route.ts` — catch-all handler via `toNextJsHandler(auth)`.

Verified: `npm run build` (compiled successfully, route shows `/api/auth/[...all]` dynamic), `npm run lint` (clean).

### Decisions

- Better Auth schema migration/generation was not attempted — PostgreSQL is not running locally. Deferred to full stack smoke test (Task 10).
- `.env.example` already contained `NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000` (added early in `foundation-001`).
- Build-time Better Auth warnings ("default secret", "Base URL could not be determined") are expected — these resolve when `.env` is populated with real values.

### Follow-ups

- Proceed to `foundation-008` — Auth pages (login/register).
- Run `npx better-auth migrate` when PostgreSQL is available to create auth tables.

## 2026-05-18 — foundation-007 closeout

### What was done

- Processed QA verdict `APPROVED WITH RESERVATIONS` for `foundation-007`.
- Applied the required documentation corrections before Security review.
- Processed Security verdict `CLEAN`.
- Confirmed the auth slice also resolved all mandatory carry-over preconditions from `foundation-006`.
- Rotated active Builder, QA, Security, and Orchestrator files to `foundation-008`.

### Decisions

- The separate `@better-auth/client` package is unnecessary for this implementation and should stay removed.
- Better Auth schema generation remains deferred until PostgreSQL is available.

### Follow-ups

- Begin `foundation-008` — Auth pages.

## 2026-05-18 — foundation-008: Auth pages

### What was done

- Created `frontend/src/app/login/page.tsx` — combined login/register client page matching foundation plan Task 8.
- Mode toggle: `"login"` (default) / `"register"`, driven by a `useState` toggling between the two.
- Register mode shows an additional Name field; login mode shows Email + Password only.
- Error state: surface Better Auth error messages or a generic Portuguese fallback.
- Loading state: submit button disabled and shows `"..."` while the async call is in flight.
- On success: `router.push("/")` redirects to the root route (default scaffold page until Task 9 replaces it with the protected dashboard shell).
- Uses `authClient.signIn.email` and `authClient.signUp.email` from `src/lib/auth-client.ts`.
- Uses shadcn Card, CardHeader, CardTitle, CardContent, Input, Label, Button components.
- Verified: `npm run build` (compiled successfully, `/login` route appears in the build output) and `npm run lint` (no issues found).

### Decisions

- Page code matches the foundation plan Task 8 template exactly — no deviations.
- `router.push("/")` lands on the default create-next-app template page until Task 9 builds the protected dashboard. This is expected and correct at this stage.
- The mode-toggle link is a bare `<button type="button">`, not the shadcn Button — matching the plan intentionally to avoid the variant styling on the toggle.
- Build-time Better Auth warnings ("Base URL could not be determined", "default secret") are expected and pre-existing from Task 7.

### Follow-ups

- Proceed to `foundation-009` — Route protection middleware and dashboard shell.
- Run `npx better-auth migrate` and validate end-to-end sign-up/sign-in when PostgreSQL becomes available.

## 2026-05-18 — foundation-008 QA correction pass

### What was done

- Applied two QA-required corrections to `frontend/src/app/login/page.tsx`:
  1. Mode toggle `onClick` now calls `setError("")` before switching modes — clears stale error state when the user switches between login and register.
  2. Both `signIn.email` and `signUp.email` error branches now use `error.message ?? "Erro desconhecido"` — guards against undefined message fields.
- Verified: `npm run build` (compiled successfully) and `npm run lint` (no issues found).
- Recorded the follow-up in `STATUS.json` and `HANDOFF.md`: map raw Better Auth error strings to safe Portuguese messages before the `foundation-010` smoke test.

### Decisions

- Both fixes are minimal single-expression changes targeting the exact lines QA flagged; no surrounding code was altered.
- The error-message mapping follow-up is non-blocking for `foundation-009` and is tracked in state docs for pre-`foundation-010` resolution.

### Follow-ups

- Proceed to `foundation-009` — Route protection middleware and dashboard shell.

## 2026-05-18 — foundation-008 closeout

### What was done

- Processed QA verdict `APPROVED WITH RESERVATIONS` for `foundation-008`.
- Applied the two required UI corrections before Security review.
- Processed Security verdict `ADVISORY`.
- Recorded safe auth error-message mapping as a required pre-`foundation-010` follow-up.
- Rotated active Builder, QA, Security, and Orchestrator files to `foundation-009`.

### Decisions

- Task 8 can close without implementing safe auth-error translation yet, but raw Better Auth messages must not survive into end-to-end smoke testing.

### Follow-ups

- Begin `foundation-009` — Route protection and dashboard shell.
- Before `foundation-010`, map Better Auth errors to safe Portuguese UI messages.

## 2026-05-18 — foundation-009: Route protection and dashboard shell

### What was done

- Created `frontend/src/middleware.ts` — route-protection middleware:
  - `PUBLIC_PATHS = ["/login", "/api/auth"]` — these routes skip session checks.
  - Checks for `better-auth.session_token` or `__Secure-better-auth.session_token` cookies.
  - Redirects unauthenticated requests to `/login` while preserving redirect behavior.
  - Matcher excludes `_next/static`, `_next/image`, `favicon.ico`.
- Updated `frontend/src/app/layout.tsx` — metadata (`"hebrai.co — Hebraico Bíblico"`), `lang="pt-BR"`, simplified body to `antialiased` class.
- Replaced `frontend/src/app/page.tsx` — dashboard shell:
  - Server component with `async` session check via `auth.api.getSession`.
  - Missing session → `redirect("/login")`.
  - Authenticated → shows `שָׁלוֹם, {name}` heading + `"Dashboard — em construção"` paragraph.
- Verified: `npm run build` (compiled successfully, route tree shows `/` dynamic, `/login` static, `ƒ Proxy (Middleware)`) and `npm run lint` (clean).
- Updated `HANDOFF.md`, `STATUS.json`, `docs/progress.md`, and `docs/session-log.md`.

### Decisions

- Next.js 16.2 emits a deprecation warning: `"middleware" file convention is deprecated. Please use "proxy" instead.` This is informational — `middleware.ts` still compiles and functions correctly. Migration to `proxy.ts` is a later concern.
- Middleware uses cookie-based session detection (no DB call) — lightweight and correct for route gating. The server-side `page.tsx` performs the real session validation via `auth.api.getSession`.
- Live route-protection testing was not possible — Better Auth tables require a running PostgreSQL instance. Deferred to `foundation-010`.

### Follow-ups

- Proceed to `foundation-010` — Full stack smoke test.
- Consider migrating `middleware.ts` to `proxy.ts` when the Next.js 16 migration path stabilizes.
- Map Better Auth raw errors to safe Portuguese UI messages before end-to-end validation.

## 2026-05-18 — foundation-009 correction: proxy migration

### What was done

- Replaced `frontend/src/middleware.ts` with `frontend/src/proxy.ts` using the same route-protection behavior:
  - `PUBLIC_PATHS = ["/login", "/api/auth"]`
  - checks `better-auth.session_token` and `__Secure-better-auth.session_token`
  - redirects unauthenticated requests to `/login`
  - matcher excludes `_next/static`, `_next/image`, `favicon.ico`
- Updated active docs/plans so Task 9 no longer teaches the deprecated `middleware.ts` convention.
- Updated `HANDOFF.md` and `STATUS.json` to reflect the corrected proxy-based result.

### Verification

- `npm run lint` — pass.
- `npm run build` — pass.
- Build output no longer reports `middleware` file-convention deprecation.
- Build still reports existing Better Auth environment warnings in local no-env mode (`BETTER_AUTH_URL` unset, default secret in use).

### Follow-ups

- Proceed to `foundation-010` — Full stack smoke test.
- Map Better Auth raw errors to safe Portuguese UI messages before end-to-end validation.
