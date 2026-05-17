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
