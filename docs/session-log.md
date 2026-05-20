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

## 2026-05-18 — foundation-010: Full stack smoke test

### What was done

**Blockers resolved before smoke test:**

1. **Seed SQL migration** — `database/migrations/002_seed_words.sql` created with all 20 Hebrew words as `INSERT ... ON CONFLICT (hebrew) DO NOTHING`. The postgres service is on the `internal` Docker network with no exposed ports; the Python seed script cannot connect from the host. Auto-seeding via postgres `initdb.d` (SQL files in `./database/migrations`) is the only viable path.

2. **PostgreSQL 18 volume path** — `docker-compose.yml` volume was mounted at `/var/lib/postgresql/data`. postgres:18-alpine changed to major-version-specific data dirs; the image expects the volume at `/var/lib/postgresql`. The container entered a restart loop until this was corrected.

**Build results:**
- `docker compose build` — `hebraico-fastapi` and `hebraico-next` both built without errors.
- Build-time Better Auth warnings (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` unset) are expected: env vars are runtime-only; the `.env` file is not read at image build time.
- Build output confirmed `ƒ Proxy (Middleware)` — proxy.ts is wired as middleware in Next.js 16.2.

**Health check results (live):**
| Check | Command | Result |
|---|---|---|
| nginx/Next.js | `curl -s -o /dev/null -w "%{http_code}" http://localhost:80` | `307` (proxy redirect to /login — middleware active) |
| FastAPI | `docker compose exec fastapi python -c "urllib.request..."` | `{"status":"ok"}` |
| PostgreSQL | `docker compose exec postgres psql ... -c "SELECT COUNT(*) FROM words;"` | `count = 20` |

Stack torn down cleanly with `docker compose down`.

**Sensors:**
- `npm run lint` — clean.
- `npm run build` — compiled successfully.

### Decisions

- Seed via SQL migration (`002_seed_words.sql`) rather than Python script, since postgres is internal-only in Docker Compose.
- Better Auth error-message follow-up **deferred** — the smoke test does not exercise auth flows. Implementing it requires Better Auth tables (`npx better-auth migrate`) and is properly scoped to the first core-engine task that exercises auth.
- `NEXT_PUBLIC_BETTER_AUTH_URL` is not passed as a Docker `build.args` entry in `docker-compose.yml` — the `http://localhost:3000` fallback is baked in at image build time. This is non-blocking for local smoke testing but must be addressed before production deployment.
- Docker binary on this machine: `/usr/local/bin/docker` is a broken AppTranslocation symlink. Invoke Docker as `/Applications/Docker.app/Contents/Resources/bin/docker` with `PATH` set to include that directory for credential helper resolution.

### Follow-ups

- Commit all uncommitted changes spanning foundation-001 through foundation-010 when instructed.
- Before any auth E2E testing: run `npx better-auth migrate` against a running postgres instance.
- Add `NEXT_PUBLIC_BETTER_AUTH_URL` as a Docker `build.args` entry before production deployment.
- Map Better Auth raw errors to safe Portuguese UI messages (carried from foundation-008 security advisory).
- Begin `core-001` — Backend infrastructure.

## 2026-05-19 — core-004: Session router

### What was done

- Created `backend/session_router.py`:
  - `GET /session/next-cards`: reads user settings, fetches due cards (joined with words), introduces new words up to `daily_new_limit`, generates/caches AI content per card, returns `NextCardsResponse`.
  - `POST /session/review`: validates card ownership, validates and parses `fsrs_state`, calls `schedule_review`, updates DB, inserts `review_log` row, returns `ReviewResponse`.
  - `_validate_fsrs_state()`: router-layer guard — checks type is dict; checks `due`/`last_review` fields are valid ISO datetime strings; raises HTTP 422 with a coherent message on failure.
- Modified `backend/main.py`: registered `session_router` via `app.include_router`.
- Created `backend/tests/test_session_router.py`: 7 tests.

### Routes added

| Method | Path | Auth |
|---|---|---|
| GET | `/session/next-cards` | `X-User-ID` header (required) |
| POST | `/session/review` | `X-User-ID` header (required) |

### Sensors

| Sensor | Result |
|---|---|
| Red phase: `pytest tests/test_session_router.py` | 6 failed (routes 404), 1 passed — confirmed |
| Docker build | PASS |
| Green phase: `pytest tests/test_session_router.py` | **7 passed** |
| Full suite: `pytest tests/` | **22 passed, 0 regressions** |

### Residual risks for `core-005`

- `provider.generate()` still raises `NotImplementedError` — real SDK wrappers needed before live AI calls.
- The `IN (SELECT word_id FROM cards WHERE user_id = %s)` subquery in new-word fetch is a correlated subquery; acceptable at current scale but should be replaced with a LEFT JOIN anti-join for larger word lists.
- AI content cache insert uses `ON CONFLICT DO NOTHING`; a concurrent race could leave a card without content if the INSERT loses — acceptable for now.

## 2026-05-19 — core-004 closeout

### What was done

- Completed Builder -> QA -> Security closeout for `core-004` — Session router.
- Accepted `backend/session_router.py`, `backend/tests/test_session_router.py`, and `backend/main.py` router registration.
- Confirmed the deferred router-layer `fsrs_state` validation requirement from earlier reviews is now closed.

### Decisions

- `core-004` is accepted with QA verdict `APPROVED WITH RESERVATIONS` and Security verdict `ADVISORY`.
- `core-005` is unblocked.
- The router-layer `fsrs_state` trust-boundary fix is complete:
  - non-dict state returns `422`
  - invalid ISO datetime strings in `due` / `last_review` return `422`
  - invalid state no longer reaches `datetime.fromisoformat()` inside the FSRS service

### Follow-ups

- Before `core-009`, harden `backend/session_router.py` for:
  - `daily_new_limit` / preferred provider null-coalescing
  - invalid DB `format_override` returning a structured client error instead of a bare 500
  - `ReviewRequest.response_time_ms` range constraints
- Before any external exposure of backend routes:
  - replace trusted `X-User-ID` header identity with validated session/user forwarding
  - stop echoing internal Python type names in `fsrs_state` validation errors

## 2026-05-19 — pre-core-004 hardening: model constraints, error handling, thread safety

### What was done

- `backend/models.py`: `ReviewRequest.format_used` → `Literal["multiple_choice", "flashcard", "typing"]`.
- `backend/ai_service.py`:
  - `_build_prompt()` raises `ValueError("Unsupported exercise_format: ...")` for unknown formats.
  - `generate_content()` wraps `json.loads` — `JSONDecodeError` is re-raised as `ValueError("Provider returned non-JSON content...")`.
  - Added docstring on `_Provider.generate()` expected response shape.
  - Added comment in `_build_prompt()` noting `Word` fields are DB-sourced/trusted at this layer.
- `backend/db.py`: `_get_pool()` uses double-checked locking with `threading.Lock` to prevent duplicate pool creation under concurrent requests.
- `backend/tests/test_ai_service.py`: added `test_build_prompt_raises_for_unknown_format` and `test_generate_content_raises_on_malformed_json`.

### Sensors

| Sensor | Result |
|---|---|
| Docker build | PASS |
| `pytest tests/ -v` | **15 passed, 0 regressions** |

### Residual risks for `core-004`

- `fsrs_state` datetime values are still trusted at the service layer (they come from the DB through the router). Shape validation before `datetime.fromisoformat()` belongs in the router or a dedicated validator in `core-004`.
- Real provider SDK wrappers not yet implemented — `provider.generate()` still raises `NotImplementedError`.

## 2026-05-19 — core-003: AI content generation service

### What was done

- Created `backend/ai_service.py`: `hash_prompt`, `_build_prompt`, `generate_content`, and `_Provider` placeholder.
- Created `backend/tests/test_ai_service.py`: 5 tests with mocked provider responses for all three exercise formats.
- Applied carry-forward constraints:
  - `backend/models.py`: `CardWithContent.format` → `Literal["multiple_choice", "flashcard", "typing"]`; `ReviewRequest.rating` → `Literal[1, 2, 3, 4]`.
  - `backend/fsrs_service.py`: `fsrs_state_to_card()` uses explicit `"key" in state` guards; partial dicts no longer overwrite FSRS defaults with `None`.

### Decisions

- Provider interface is a `_Provider` placeholder class with a `.generate()` method that raises `NotImplementedError`. Tests patch `ai_service.provider.generate`. Real SDK wrappers will replace or extend this when the first real provider is wired.
- `hash_prompt` uses `provider_name: str` as the parameter name (not `provider`) to avoid shadowing the module-level `provider` object.
- No provider SDK dependencies added in this slice per the scope constraint.

### Sensors

| Sensor | Result |
|---|---|
| Red phase: `pytest tests/test_ai_service.py` before `ai_service.py` | `ModuleNotFoundError` — confirmed |
| Green phase: `pytest tests/` after implementation | **13 passed** |
| Full suite regressions | 0 |

### Residual risks / carry-forward to `core-004`

- `_get_pool()` lazy init is still not thread-safe — add `threading.Lock` before `core-004`.
- `fsrs_state` values from the DB are trusted at the service layer; add shape validation before `datetime.fromisoformat()` once the router is wired.
- Real AI provider SDK wrappers not yet implemented; `generate_content` will raise `NotImplementedError` in production until they're added.

## 2026-05-19 — core-003 closeout

### What was done

- Completed Builder -> QA -> Security closeout for `core-003` — AI content generation service.
- Accepted `backend/ai_service.py`, `backend/tests/test_ai_service.py`, the `backend/models.py` Literal constraints, and the `backend/fsrs_service.py` partial-state hardening.
- Confirmed the slice remains service-only: no router wiring, no DB caching layer, and no real provider SDK integration yet.

### Decisions

- `core-003` is accepted with QA verdict `APPROVED WITH RESERVATIONS` and Security verdict `ADVISORY`.
- Real provider SDK integration remains intentionally deferred; the placeholder provider boundary is acceptable for this slice.
- The next step should be a small pre-`core-004` hardening pass rather than starting router work immediately.

### Follow-ups

- Before `core-004`, constrain `ReviewRequest.format_used` to the same exercise-format Literal set.
- Before `core-004`, make `_build_prompt()` raise for unknown `exercise_format` instead of falling through to typing.
- Before `core-004`, wrap provider-response `json.loads()` in structured error handling.
- Before `core-004`, make `_get_pool()` thread-safe and validate `fsrs_state` shape before datetime parsing.
- Before or alongside real SDK wiring, document the trusted-source assumption for `Word` prompt fields and validate `DEFAULT_AI_MODEL` against an allowlist or explicit provider contract.

## 2026-05-19 — core-002: FSRS scheduling service

### What was done

- Created `backend/fsrs_service.py` with `fsrs_state_to_card`, `card_to_fsrs_state`, `schedule_review`, `determine_format`.
- Created `backend/tests/test_fsrs_service.py` with 8 tests covering all acceptance criteria.
- Added `fsrs==6.3.1` to `backend/requirements.txt`.

### Decisions

- PyPI package name is `fsrs` (not `py-fsrs` as named in the plan). The plan import `from fsrs import Scheduler, Card as FSRSCard, Rating, State` is correct.
- `fsrs` v6 removed the `reps` field from `Card`. The v6 `Card` fields are: `card_id`, `state`, `step`, `stability`, `difficulty`, `due`, `last_review`. The plan's `determine_format` and test assertions depend on `reps`, so `reps` is carried as a synthetic counter in our state dict (incremented by `schedule_review`) and set as a dynamic attribute on the Card object (dataclass without `__slots__`, so dynamic attributes are safe).
- The `card_id` generated by fsrs is not preserved across state serialization — we do not track it because our DB uses its own `card_id` column.

### Sensors

| Sensor | Result |
|---|---|
| Red phase: pytest before fsrs_service.py exists | `ModuleNotFoundError` (1 error) — confirmed |
| Green phase: pytest after implementation | 8 passed in 0.03s |
| Full suite `pytest tests/` | 8 passed, 0 errors, 0 regressions |

### Residual risks / follow-ups

- Before `core-003`: constrain `CardWithContent.format` to `Literal["multiple_choice", "flashcard", "typing"]` and `ReviewRequest.rating` to `Literal[1, 2, 3, 4]` in `models.py`.
- Before `core-004`: add a lock guard around `_get_pool()` lazy initialization in `db.py`.
- `reps` is a synthetic counter not validated by fsrs itself — if state is written externally with an incorrect `reps`, `determine_format` may misbehave silently. This is acceptable for the current slice; add input validation at the router layer in `core-004`.

## 2026-05-19 — core-001 security hardening: backend/.dockerignore

### What was done

- Created `backend/.dockerignore` as a security follow-up from the `core-001` Security ADVISORY.
- Excludes: `.env`, `.env.*`, `__pycache__/`, `*.pyc`, `*.pyo`, `*.pyd`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`, `*.egg-info/`, `dist/`, `build/`, `.DS_Store`, `*.swp`, `*.swo`.

### Sensors

| Sensor | Result |
|---|---|
| File exists and contains required entries | PASS |
| Docker image build with `.dockerignore` present | PASS |

### Decisions

- Did not exclude `tests/` from the build context — the tests directory is harmless in the image and exclusion would be premature without a confirmed production hardening pass.
- Kept scope strictly to the advisory: no Dockerfile refactor, no db.py thread-safety fix, no model constraint changes.

### Residual risk

- `.env` exclusion only protects the build context; runtime secret injection (via Docker Compose `env_file`) is unchanged and remains correct.
- A broader production hardening pass (multi-stage build, non-root user, stripped dev tools) is deferred to the deploy phase.

## 2026-05-19 — core-001: Backend infrastructure

### What was done

- Created `backend/db.py`: lazy-init `ThreadedConnectionPool` (min=1, max=10) from `DATABASE_URL`; FastAPI generator dependency that yields a connection, commits on success, rolls back on exception, and always returns the connection to the pool via `putconn`.
- Created `backend/models.py`: pure Pydantic contracts — `Word`, `CardWithContent`, `NextCardsResponse`, `ReviewRequest`, `ReviewResponse`. Shapes aligned with core-engine plan. No business logic.
- Added to `backend/requirements.txt`: `psycopg2-binary==2.9.10`, `pytest==8.3.4`, `httpx==0.28.1`, `pytest-mock==3.14.0`.
- Created `backend/tests/__init__.py` (empty) and `backend/tests/conftest.py`: `mock_db` fixture (MagicMock conn+cursor) and `client` fixture (TestClient with `app.dependency_overrides` wiring; clears overrides in teardown).
- Updated `backend/Dockerfile`: added `build-essential` + `libpq-dev` to apt-get install before pip — necessary because `psycopg2-binary 2.9.10` has no pre-built wheel for Python 3.14 (aarch64 or amd64) and must compile from source.

### Sensors

| Sensor | Result |
|---|---|
| Docker image build | PASS |
| Import smoke test (`from db import db_connection; from models import …`) | PASS |
| `pytest tests/` | exit 5 — 0 tests collected (conftest-only, expected for this slice) |

### Decisions

- `psycopg2-binary` requires `build-essential` + `libpq-dev` on Python 3.14-slim because no pre-built wheel exists for this runtime yet. Dockerfile updated as a necessary companion change (not in original target-files list but required to make the slice functional).
- No psycopg2 mock or local install attempted; Docker is the canonical build path for the backend.
- conftest.py imports from root-level `main` and `db` (flat module layout, matches `cd backend && pytest` convention).

### Follow-ups

- Run `npx better-auth migrate` before auth E2E testing.
- Add `NEXT_PUBLIC_BETTER_AUTH_URL` as Docker build arg before production deployment.
- Add `.env.example` guidance for `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY` before real AI calls in core-003.
- QA and Security review pending for this slice.

## 2026-05-19 — core-001 closeout and Docker build-context hardening

### What was done

- Committed the `core-001` backend slice and the backend Docker build-context hardening as `95a75d9` (`feat: add backend infrastructure and docker context guard`).
- Completed the Security follow-up from `core-001` by creating `backend/.dockerignore`.
- `backend/.dockerignore` excludes `.env`, `.env.*`, `__pycache__/`, `*.pyc`, `*.pyo`, `*.pyd`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`, `*.egg-info/`, `dist/`, `build/`, `.DS_Store`, `*.swp`, `*.swo`.
- Closed the specific advisory about Docker build-context secret exposure from `backend/Dockerfile` using `COPY . .`.

### Decisions

- `core-001` is accepted as complete with QA verdict `APPROVED WITH RESERVATIONS` and Security verdict `ADVISORY`.
- The `.dockerignore` hardening follow-up is accepted with QA verdict `APPROVED` and Security verdict `CLEAN`.
- `STATUS.json` now marks `core-001` `tests: false` because the slice added fixture scaffolding only; no real `test_*.py` module exists yet.

### Follow-ups

- Begin `core-002` — FSRS scheduling service.
- Before `core-003`, constrain `CardWithContent.format` and `ReviewRequest.rating`.
- Before `core-004`, make `_get_pool()` lazy initialization thread-safe.
- Before production hardening, move the backend image to multi-stage, add a non-root user, validate `DATABASE_URL` explicitly, pin `pydantic`, and later extend `.dockerignore` with `.venv/`, `venv/`, and `htmlcov/`.

## 2026-05-19 — core-002 closeout

### What was done

- Completed Builder -> QA -> Security closeout for `core-002` — FSRS scheduling service.
- Accepted `backend/fsrs_service.py`, `backend/tests/test_fsrs_service.py`, and `backend/requirements.txt` with `fsrs==6.3.1`.
- Confirmed the slice remains service-only and does not start router, AI, or frontend work.

### Decisions

- `core-002` is accepted with QA verdict `APPROVED WITH RESERVATIONS` and Security verdict `ADVISORY`.
- The PyPI package name remains `fsrs`; no plan correction file was needed because the implementation note in state docs is sufficient.
- `reps` remains an app-level synthetic counter outside the upstream fsrs `Card` shape.

### Follow-ups

- Before `core-003`, constrain `CardWithContent.format` and `ReviewRequest.rating` in `backend/models.py`.
- Before `core-003` leaves QA, guard `fsrs_state_to_card()` so missing keys do not overwrite FSRS defaults with `None`.
- Before `core-004`, add `_get_pool()` locking, validate `rating` before `_RATING_MAP` lookup, and validate `fsrs_state` shape before datetime parsing.

## 2026-05-18 — foundation section closeout

### What was done

- Processed `foundation-010` QA verdict: `APPROVED`.
- Processed `foundation-010` Security verdict: `ADVISORY`.
- Confirmed the full foundation section (`foundation-001` through `foundation-010`) is complete and committed at `1840e83`.
- Promoted the tracker from `foundation` to `core-engine` for the next working phase.
- Moved the remaining infra/auth/security advisories into explicit `core-001` entry constraints in `STATUS.json`.

### Decisions

- Foundation is considered closed even though several follow-ups remain; those follow-ups are phase-entry constraints for `core-engine`, not reopening items for foundation tasks.
- The Docker AppTranslocation path issue is machine-specific context only; it should stay in session history and handoff notes, not be generalized into repository-wide runtime assumptions.

### Follow-ups

- Start `core-001` with the recorded constraints:
  - run `npx better-auth migrate` before auth E2E work
  - add `NEXT_PUBLIC_BETTER_AUTH_URL` as a Docker build arg before non-local deploy paths are considered valid
  - document `docker-entrypoint-initdb.d` first-init-only behavior for DB resets
  - add `.env.example` placeholders and guidance for `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and `GOOGLE_API_KEY`
  - replace raw Better Auth error forwarding with safe Portuguese user-facing messages before enabling auth flows
