# HANDOFF.md — Session Memory

> Updated by the agent at the end of each session.
> This file is the context bridge between different sessions.

## Last update

- **Date:** 2026-05-27T21:00Z
- **Session:** QA/Security correction pass for forgot-password. Sensors clean.
- **Branch / HEAD:** `main` — local ahead of `origin/main` by multiple commits (GitHub SSH not available on dev machine; rsync bootstrap required to deploy).

## Goals completed this session (forgot-password — 2026-05-27)

- Implemented full forgot-password / password-reset flow via Better Auth + nodemailer SMTP.
  - **`frontend/src/lib/email.ts`** (new): lazy SMTP transport via nodemailer. `sendEmail({ to, subject, html })`. Transport created per-call to avoid module-top-level crash when SMTP env vars are absent during static build.
  - **`frontend/src/lib/auth.ts`**: added `emailAndPassword.sendResetPassword` callback. Calls `sendEmail` to deliver a Portuguese reset-link email. Template includes the Better Auth `url` (full token link). No user data exposed beyond the email they entered.
  - **`frontend/src/proxy.ts`**: added `/reset-password` to `PUBLIC_PATHS` — critical for email link landing.
  - **`frontend/src/app/login/page.tsx`**: added third `"forgot"` mode. "Esqueci minha senha" link visible on the login mode. Uses `authClient.requestPasswordReset({ email, redirectTo: "/reset-password" })`. Generic success message "Se existir uma conta com este email, enviaremos instruções." (no email enumeration).
  - **`frontend/src/app/reset-password/page.tsx`** (new): Suspense-wrapped `useSearchParams()`. Handles `?token=` (new-password form → `authClient.resetPassword`) and `?error=INVALID_TOKEN` (expired/invalid link copy with back-to-login button). Client-side password length (≥8) and match validation before API call.
  - **`.env.example`**: documented `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
  - **`frontend/package.json`**: added `nodemailer` dependency.
- Sensors: `npm run lint` — clean; `npm run build` — compiled; `/reset-password` appears as `○` (static) in route tree.
- Commit: `feat: add forgot-password flow with Better Auth and SMTP email`

### Residuals for forgot-password
  - SMTP env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SECURE`) must be set in the VPS `.env` before reset emails will deliver. `.env.example` now documents them.
  - No automated test covers the reset email path (requires live SMTP and Better Auth DB).
  - The VPS has not been re-deployed with this change. Next deploy (rsync bootstrap) will pick it up.
  - Better Auth token expiry default is 1 hour — acceptable for now.

## Goals completed this session (QA/Security correction pass for forgot-password — 2026-05-27)

- **proxy.ts default export:** Added `export default proxy` alongside the named `proxy` export per Next.js 16 API reference. Task requested rename to `middleware.ts` but Next.js 16 docs (in repo at `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`) explicitly state `middleware.ts` is deprecated and the codemod migrates `middleware.ts` → `proxy.ts`, not the reverse. Renaming would silently break route protection; user confirmed keep `proxy.ts`.
- **Same-origin check in `sendResetPassword`:** Before sending the email, the reset `url` is parsed and its origin is compared against `BETTER_AUTH_URL`. Mismatches (including malformed URLs or a misconfigured base) log a structured server-side error and abort the send without surfacing details to the client.
- **Structured error logging for email delivery failures:** `sendEmail` is now wrapped in `try/catch`. Failures are logged as `[reset-password] email delivery failed: <message>`. The catch does not re-throw — anti-enumeration behavior (the HTTP response is unchanged) is preserved.
- Sensors: `npm run lint` — clean; `npm run build` — compiled; `npm audit` — 2 moderate vulns in Next.js's internal postcss (pre-existing, fix requires downgrading Next.js to 9.3.3).

### Residual risks (QA correction pass)
  - `npm audit` 2 moderate: `postcss <8.5.10` in Next.js's internal dependency tree. Not introduced by this PR. The only fix (`npm audit fix --force`) would downgrade Next.js to 9.3.3 — do not apply. Monitor for a Next.js patch that upgrades its bundled postcss.
  - VPS not yet redeployed with these changes.

## Deploy summary (2026-05-27)

- **Commit deployed:** `cd21e54` (Refactor DashboardStats to use LumenMetricCard, update styling and layout, add AI provider badge)
- **Sensors:** `npm run lint` clean; `npm run build` compiled (Better Auth env warnings pre-existing)
- **Push:** failed — GitHub SSH key not configured on dev machine; origin remains at `28b7576`
- **Sync:** rsync to `vps:~/apps/hebrai/` completed; `.env` not touched
- **VPS rebuild:** `docker compose up -d --build fastapi next` — both images built and containers recreated
- **Container health:** postgres up (unchanged), fastapi up, next up (127.0.0.1:3000→3000)
- **Production smoke:**
  - `https://hebrai.co/login` → HTTP/2 200, HSTS present ✓
  - `https://hebrai.co` → HTTP/2 307 → `/login`, HSTS present ✓
- **QA verdict:** APPROVED WITH RESERVATIONS. Availability/TLS smoke passed; browser-level visual QA and authenticated session API smoke were not performed in this deploy cycle.
- **Security verdict:** ADVISORY. No critical vulnerabilities introduced. Main new hardening item is provider allowlist validation before passing `preferred_provider` into `generate_content()`.

## Goals completed this session

- Applied the first production-facing `Lumen` redesign pass across the main frontend surfaces.
  - Chosen direction is the dark `Lumen` system from `/Users/filipenegrao/Downloads/hebrai.co`.
  - Scope intentionally limited to the primary user-facing surfaces for now:
    1. `/login`
    2. `/`
    3. `/session`
    4. `/settings`
  - Work sequence followed the requested order:
    1. global tokens and fonts
    2. shared chrome/components
    3. page-level rewrites
- Added a reusable `frontend/src/components/LumenChrome.tsx` layer.
  - `LumenShell`
  - `LumenHeader`
  - `LumenEyebrow`
  - `LumenPageTitle`
  - `LumenPanel`
  - `LumenMetricCard`
  - `LumenProgressDots`
- Reworked the global frontend theme for the new direction.
  - `frontend/src/app/layout.tsx` now loads `Cormorant Garamond`, `IBM Plex Mono`, `David Libre`, and keeps `Noto Serif Hebrew`.
  - `frontend/src/app/globals.css` now defines the `Lumen` token palette (`midnight`, `gold`, `bone`, glow/hairline variants) and adds shared utilities for the dark editorial shell.
  - Shared shadcn/base-ui primitives (`Button`, `Card`, `Input`, `Label`) now inherit the new visual system instead of the default grayscale shell.
- Rebuilt the four requested surfaces on top of the new tokens/components.
  - `frontend/src/app/login/page.tsx`: split hero + auth card layout with Hebrew wordmark and product framing.
  - `frontend/src/app/page.tsx`: new dashboard hero, day-program panel, and `Lumen` metrics treatment.
  - `frontend/src/app/session/page.tsx`: new session shell around the existing exercise flow, including improved empty/error/complete states.
  - `frontend/src/app/settings/page.tsx`: provider cards, session-size slider, niqqud toggle cards, and Lumen page framing.
- Restyled the shared study UI without changing backend behavior.
  - `DashboardStats`, `SessionProgress`, `RatingBar`, and `ExerciseCard` now render in the `Lumen` language.
  - The previously-added Claude provider badge is preserved and now sits inside the new dark card treatments.
- Sensors run for this redesign pass:
  - `cd frontend && npm run lint` — clean
  - `cd frontend && npm run build` — compiled successfully
  - Build still emits the pre-existing Better Auth warnings/errors when env defaults are missing during static generation; this pass did not change auth config.

### Carry-forward residuals from this redesign pass
  - The redesign is only the first pass on the main surfaces. Secondary screens such as future progress/library/landing work are still untouched.
  - The Claude badge payload changes in `backend/models.py`, `backend/session_router.py`, and `frontend/src/lib/api.ts` are now committed in `cd21e54` and deployed to the VPS.
  - No browser-runtime visual QA was run during implementation; the VPS deploy smoke only confirmed availability/TLS and anonymous redirect behavior.
  - Production is ahead of `origin/main` by 1 commit because GitHub SSH/push failed on the dev machine. Fix push/source-of-truth drift before treating the VPS as auditable production state.
  - Add an allowlist guard in `backend/session_router.py` before passing `preferred_provider` into `generate_content()` so corrupt DB values fall back safely before DB CHECK constraints land.

## Goals completed this session

- Completed the first live production cutover for `hebrai.co` on the VPS.
  - DNS for `hebrai.co` and `www.hebrai.co` points to the VPS.
  - Production shape changed from container-edge nginx to **host nginx** on the VPS, with Docker exposing only the app stack (`next` on `127.0.0.1:3000`, `fastapi` internal-only, `postgres` internal-only).
  - App code was synced to the VPS at `~/apps/hebrai` and configured with a real `.env`.
  - Better Auth migration was run successfully via `npm exec --yes @better-auth/cli migrate -- --config src/lib/auth.ts --yes`.
  - Host nginx + Let's Encrypt succeeded for both `hebrai.co` and `www.hebrai.co`; HTTPS is live with HSTS and reverse proxying to `127.0.0.1:3000`.
  - Live validation:
    1. `https://hebrai.co` and `https://www.hebrai.co` return `HTTP/2 307` to `/login`.
    2. Login page HTML is served through the public domain.
    3. Better Auth public session endpoint returns `null` anonymously and valid session JSON with a real cookie.
    4. A throwaway smoke user was created successfully through the public domain.
- Wired the first real AI provider path in the backend: **Anthropic / Claude**.
  - `backend/ai_service.py` now resolves the `claude` provider through the official Anthropic Python SDK when `ANTHROPIC_API_KEY` is present.
  - Default Anthropic model is `claude-sonnet-4-20250514`, overridable via `ANTHROPIC_MODEL` or `DEFAULT_AI_MODEL`.
  - `backend/session_router.py` now passes the saved provider name into `generate_content()`.
  - `hash_prompt()` now includes a prompt-version prefix (`v2`) so previously cached placeholder "Claude" content is bypassed and regenerated as real AI output after deploy.
  - `docker-compose.yml` now attaches `fastapi` to both `internal` and `external` networks. This keeps FastAPI off public ports while restoring outbound internet access for Anthropic/OpenAI/Gemini SDK calls.
  - Added `anthropic==0.104.1` to backend requirements and documented `ANTHROPIC_MODEL` in `.env.example`.
  - Tests: frontend `npm run lint` clean; frontend `npm run build` compiled; backend Docker image built cleanly; backend pytest in container **41/41 PASS**.
  - **Live verification:** a fresh public signup now returns real Claude-generated session cards with real distractors and Portuguese explanations; placeholder fallback text is no longer returned for `claude`.
- Added a first visible UI cue for AI-backed content.
  - `CardWithContent` now carries `ai_provider` from FastAPI to the frontend.
  - `ExerciseCard` renders a subtle provider badge such as `Gerado com Claude` alongside revealed AI-generated content.
  - Verification: frontend `npm run lint` clean; frontend `npm run build` compiled; backend `tests/test_session_router.py` in Docker **7/7 PASS**.

## Goals completed this session

- Completed `dash-009` — Full end-to-end verification. **`dashboard-deploy` track is now functionally complete for local development.**
  - **Environment notes:** Docker daemon was down — started Docker Desktop (`open -a Docker`) for this slice. The `~/.docker/cli-plugins/docker-compose` symlink is a stale AppTranslocation path, so the real compose plugin was invoked directly at `/Applications/Docker.app/Contents/Resources/cli-plugins/docker-compose`. `docker` itself was run via `PATH=/Applications/Docker.app/Contents/Resources/bin`.
  - **VERIFIED live:**
    1. Backend `pytest tests/` in the fastapi container — **39/39 PASS**.
    2. `frontend && npm run build` — compiled successfully.
    3. Full-stack smoke (postgres + fastapi + next; nginx excluded locally — its cert mounts target absent `/etc/letsencrypt`): FastAPI `/health` → `ok`; PostgreSQL `SELECT COUNT(*) FROM words` → **20**.
    4. **dash-008 health-check confirmed in practice:** the exact `deploy.sh` command (`docker compose exec -T fastapi python3 -c "import urllib.request, json; print(json.loads(urllib.request.urlopen('http://localhost:8000/health').read())['status'])"`) printed `ok`. The curl→python3 correction is sound.
    5. Hardened nginx config validated via isolation `nginx -t` (throwaway self-signed cert mounted at the expected paths).
    6. **Runtime TLS proxy proven:** standalone nginx on the compose network + temp cert → HTTPS request returned **HTTP 307, `Location: /login`** (the `proxy.ts` middleware redirect reached through the TLS front door), with `Strict-Transport-Security: max-age=31536000; includeSubDomains` present and no upstream errors. nginx image is 1.30.1 (confirms `http2 on` directive syntax).
  - **FIX made this slice (verification-blocking; `nginx/nginx.conf` only):** nginx resolves literal `proxy_pass` upstream hostnames at **config-parse time**. `deploy.sh`'s pre-flight gate runs `docker compose run --rm --no-deps -T nginx nginx -t` **before** `up -d`, so on a **first deploy** (when `next` isn't running yet) the gate would fail with `host not found in upstream "next"` and abort a deploy that has a valid config. Fixed by deferring resolution to request time:
    ```nginx
    resolver 127.0.0.11 valid=30s ipv6=off;
    set $upstream_next next:3000;
    ...
    proxy_pass http://$upstream_next;
    ```
    Re-proved by re-running the isolation `nginx -t` with **no network and `next` not running** → now passes; runtime proxy re-confirmed (307 / `/login` / HSTS). `deploy.sh` left unchanged — the gate is now a true config-only pre-flight, and as a bonus nginx picks up a restarted `next` without a reload.
  - **NOT verifiable locally (VPS-only — by inspection only):** real Let's Encrypt issuance + standalone challenge, the stop/start renewal hooks, `deploy/setup-vps.sh` end-to-end, the `live/`↔`archive/` cert symlink resolution, `deploy.sh`'s `nginx -t` gate against the **real** cert mounts, and nginx serving over a real TLS chain.
  - Sensors: backend pytest 39/39; `npm run build` clean; `bash -n` (deploy scripts) clean from dash-008. Stack torn down cleanly (`compose down`); no stray containers; only `nginx/nginx.conf` changed in the repo.

### Carry-forward residuals (still open)
  - VPS deploy path still uses `rsync` bootstrap; the VPS checkout is **not** a usable git clone yet because the server's GitHub SSH key/config is broken (`no such identity /home/filipe/.ssh/github_openclaw`). Future deploy automation should restore a real `git pull` flow.
  - `dash-001` streak edge-case test still open.
  - `X-User-ID` still directly trusted/unbounded at the FastAPI layer — bound before external exposure.
  - Invalid stored provider/timezone can still cause a 500 on backend GET until DB CHECK constraints land on `user_settings`.
  - FastAPI `422` payloads forwarded through proxy unchanged; revisit before public exposure.
  - Direct server-component FastAPI fetch pattern in `page.tsx` must stay limited to validated session-derived user IDs.
  - `daily_new_limit` UI cap is 50; backend allows up to 500.
  - Standalone cert renewal causes ~5–15 s nginx downtime per ~60-day cycle.
  - Anthropic is the only real provider wired today. `gpt-4o`, `gemini`, and `ollama` remain accepted settings values but still fall back to placeholder content until their adapters are implemented.

## QA correction pass (dash-008)

- **Blocker fixed:** `deploy/deploy.sh` post-deploy health check used `docker compose exec -T fastapi curl -s ...`, but `backend/Dockerfile` (python:3.14-slim) installs only `build-essential` + `libpq-dev` — **no `curl`** — so the check failed on every deploy even when FastAPI was healthy.
- **Fix:** replaced with a `python3` stdlib one-liner run inside the container — `python3 -c "import urllib.request, json; print(json.loads(urllib.request.urlopen('http://localhost:8000/health').read())['status'])"`. Uses only tools already present in the image; still resolves to `"ok"` / `"error"` and keeps the non-zero-exit-on-failure behavior.
- Verified: `bash -n deploy/deploy.sh` passes. Full execution still requires a real VPS (Docker stack) — unverified locally.

## Goals completed this session

- Completed `dash-008` — VPS deployment scripts.
  - `deploy/setup-vps.sh`: one-time Ubuntu 24.04 provisioning. Installs Docker + Certbot, clones the repo (idempotent — skips if `.git` already present), obtains the initial cert via **standalone**, installs renewal hooks, seeds `.env` from `.env.example` (only if absent). `REPO`/`DOMAIN`/`EMAIL`/`APP_DIR` are env-overridable; `REPO` defaults to a `CHANGE_ME` placeholder that hard-fails if not set (no real repo URL or secrets hardcoded).
  - `deploy/deploy.sh`: idempotent redeploy. `git pull --ff-only` → build `next`/`fastapi` → **`nginx -t` gate in a throwaway `docker compose run --rm --no-deps` container before touching the running stack** → `up -d` → `nginx -s reload` → FastAPI `/health` check. Exits non-zero on bad nginx config or unhealthy backend.
  - Both scripts `chmod +x`, pass `bash -n`. `shellcheck` not installed locally.
  - **Certificate strategy decision (documented):** Certbot **standalone** authenticator for BOTH initial issuance and renewal. A single authenticator keeps issuance and the stored renewal config in agreement, avoiding the standalone-bootstrap/webroot-renewal mismatch. Renewal briefly stops the nginx container via `/etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh` and restarts it via `post/start-nginx.sh` (~5–15 s downtime per ~60-day renewal). Ubuntu's systemd `certbot.timer` drives scheduling; no cron entry added. Webroot was deliberately rejected as the wrong fight at this scale (extra mounts, ACME-path carve-out, and an awkward bootstrap).
  - **dash-007 hardening absorbed in this slice:**
    1. HTTP→HTTPS redirect now uses the literal canonical host `https://hebrai.co$request_uri` (no `$host` reflection of forged Host headers).
    2. HSTS `max-age=31536000; includeSubDomains` on the 443 block.
    3. Cert mounts narrowed to `/etc/letsencrypt/live/hebrai.co` + `/etc/letsencrypt/archive/hebrai.co` (both required — `live/` holds relative symlinks that resolve into `archive/`; mounting only `live/` would break cert reads).
    4. Explicit `ssl_protocols TLSv1.2 TLSv1.3` + Mozilla-intermediate `ssl_ciphers` + `ssl_prefer_server_ciphers off`.
    5. `http2 on;` (nginx 1.25+ directive; `stable-alpine` is 1.27).
    6. Standalone strategy documented here and in `docs/session-log.md`.
    7. N/A — no webroot/manual challenge in the chosen model.
    8. `nginx -t` is a mandatory gate in `deploy.sh` before the stack is started/reloaded.
  - Sensors: `npm run lint` — clean; `npm run build` — compiled (no frontend files changed this slice).
  - **Could not verify locally:** nginx config syntax (no nginx binary on dev machine; `nginx -t` also needs the live certs present), and both deploy scripts run unaltered the first time they hit a real VPS — that first execution is the de facto integration test. `dash-009` should exercise the full stack.
  - `dash-009` is unblocked.

### Carry-forward residuals (unchanged unless noted)
  - `dash-001` streak edge-case test still open.
  - `X-User-ID` still directly trusted at the FastAPI layer — bound before external exposure.
  - Invalid stored provider/timezone can still cause 500 on backend GET until DB CHECK constraints land (before `dash-009`).
  - FastAPI `422` payloads forwarded through proxy unchanged; revisit before public exposure.
  - Direct server-component FastAPI fetch pattern in `page.tsx` must stay limited to validated session-derived user IDs.
  - `daily_new_limit` UI cap is 50; backend allows up to 500 — revisit before `dash-009`.
  - **Renewal causes ~5–15 s nginx downtime every ~60 days (standalone trade-off).** Acceptable pre-launch; revisit if zero-downtime renewal becomes a requirement (would mean migrating to webroot).
  - **Deploy scripts and nginx TLS config are entirely unverified locally** — first real VPS run validates them. Set the real `REPO` URL when invoking `setup-vps.sh`.

## Goals completed this session (previous)

- Completed `dash-007` — HTTPS Nginx configuration.
  - `nginx/nginx.conf`: HTTP `80` server block now issues `301` redirect to HTTPS. New `443 ssl` server block added for `hebrai.co` and `www.hebrai.co`, referencing LetsEncrypt cert at `/etc/letsencrypt/live/hebrai.co/{fullchain,privkey}.pem`. Proxy to `next:3000` preserved; added `X-Forwarded-For` and `X-Forwarded-Proto` headers.
  - `docker-compose.yml`: nginx service now mounts `/etc/letsencrypt:/etc/letsencrypt:ro` so the container can read the certs issued by Certbot on the host.
  - Typography cleanup (dash-006 carry-forward): replaced all three remaining `font-serif` Hebrew surfaces with `[font-family:var(--font-hebrew)]` — `login/page.tsx` (logo span), `ExerciseCard.tsx` (typing Input, correct-answer span). `grep` confirms zero `font-serif` references remain in `frontend/src/`.
  - Sensors: `npm run lint` — clean; `npm run build` — compiled.
  - Nginx config syntax not locally verifiable (no nginx binary on dev machine); will be validated on first VPS deploy via `nginx -t`.
  - `dash-008` is unblocked.

### Carry-forward residuals (unchanged)
  - `dash-001` streak edge-case test still open.
  - `X-User-ID` still directly trusted at the FastAPI layer — bound before external exposure.
  - Invalid stored provider/timezone can still cause 500 on backend GET until DB CHECK constraints land (before `dash-009`).
  - FastAPI `422` payloads forwarded through proxy unchanged; revisit before public exposure.
  - Direct server-component FastAPI fetch pattern in `page.tsx` must stay limited to validated session-derived user IDs.
  - `daily_new_limit` UI cap is 50; backend allows up to 500 — revisit before `dash-009`.
  - Nginx `ssl_protocols` and `ssl_ciphers` directives not set explicitly — nginx defaults are reasonable but a hardened cipher suite (e.g. per Mozilla SSL config) should be added before production exposure.

## Goals completed this session (previous)

- Completed `dash-006` — Hebrew typography.
  - `frontend/src/app/layout.tsx`: added `Noto_Serif_Hebrew` from `next/font/google` with `subsets: ["hebrew"]` and `variable: "--font-hebrew"`. Variable injected into `<body>` className alongside existing Geist variables.
  - `frontend/src/components/HebrewWord.tsx`: replaced `font-serif` with `[font-family:var(--font-hebrew)]` — Hebrew text now uses the dedicated font variable throughout the app.
  - `frontend/src/app/settings/page.tsx` (dash-005 cleanup): save button `disabled` changed to `saveState !== "idle"` (was `=== "saving"`, which left the button enabled during the saved/error flash); `parseInt(...) || 1` replaced with explicit `isNaN` guard so clearing the input to empty doesn't misfire.
  - `STATUS.json`: `last_updated` bumped.
  - Sensors: `npm run lint` — clean; `npm run build` — compiled; route tree unchanged.
  - `dash-007` is unblocked.

### Carry-forward residuals (unchanged)
  - `dash-001` streak edge-case test still open.
  - `X-User-ID` still directly trusted at the FastAPI layer — bound before external exposure.
  - Invalid stored provider/timezone can still cause 500 on backend GET until DB CHECK constraints land (before `dash-009`).
  - FastAPI `422` payloads forwarded through proxy unchanged; revisit before public exposure.
  - Direct server-component FastAPI fetch pattern in `page.tsx` must stay limited to validated session-derived user IDs.
  - `daily_new_limit` UI cap is 50; backend allows up to 500 — revisit before `dash-009`.

## Goals completed this session (previous)

- Completed `dash-005` — Settings page.
  - `frontend/src/app/settings/page.tsx`: client component. `useEffect` loads settings on mount via `getSettings()`; `useState` manages form state. On submit calls `updateSettings()` and reflects saving/saved/error states on the button (auto-resets after 2–3 s). Fields: `preferred_provider` (native `<select>` with 4 provider options matching backend allowlist), `daily_new_limit` (number input, UI-clamped 1–50), `show_niqqud` (checkbox). Loading and error states handled before the form. Back navigation uses `useRouter().push("/")` (plain button — base-ui `Button` does not support `asChild`). All copy in Portuguese.
  - Sensors: `npm run lint` — clean; `npm run build` — compiled; `/settings` appears as `○` (static shell) in route tree. No backend changes; backend baseline 39/39 still holds.
  - `dash-006` is unblocked.

### Carry-forward residuals (unchanged)
  - `dash-001` streak edge-case test still open.
  - `X-User-ID` still directly trusted at the FastAPI layer — bound before external exposure.
  - Invalid stored provider/timezone can still cause 500 on backend GET until DB CHECK constraints land (before `dash-009`).
  - FastAPI `422` payloads forwarded through proxy unchanged; revisit before public exposure.
  - Direct server-component FastAPI fetch pattern in `page.tsx` must stay limited to validated session-derived user IDs.
  - `daily_new_limit` UI cap is 50; backend allows up to 500 — intentional gap, revisit before `dash-009`.

## Goals completed this session (previous)

- Completed `dash-004` — Dashboard UI.
  - `frontend/src/components/DashboardStats.tsx`: presentational 4-card stats grid (streak, reviews today, new words today, retention). Uses shadcn Card. Accepts `DailyStats` from `@/lib/api`. Layout: 2-col grid on mobile, 4-col on sm+.
  - `frontend/src/app/page.tsx`: full dashboard server component. Better Auth session check with redirect to `/login` if unauthenticated. Stats fetched directly from FastAPI via `FASTAPI_URL`+`X-User-ID` (correct server-side pattern — avoids circular HTTP call through the Next.js proxy). Stats are non-blocking (null on error = dashboard renders without stats). Hebrew greeting, settings link, "Iniciar sessão de estudo" button.
  - Sensors: ruff 4 pre-existing; mypy 5 pre-existing; pytest 39/39 PASS; ESLint clean; build compiled — `/` is dynamic `ƒ`.
  - `dash-005` is unblocked.

### Carry-forward residuals (unchanged)
  - `dash-001` streak edge-case test still open.
  - `X-User-ID` still directly trusted at the FastAPI layer — bound before external exposure.
  - Invalid stored provider/timezone can still cause 500 on backend GET until DB CHECK constraints land.
  - FastAPI `422` payloads forwarded through proxy unchanged; revisit before public exposure.
  - Direct server-component FastAPI fetch is now an allowed pattern only when `X-User-ID` comes from a validated server-side session; keep that constraint documented and do not copy it into client components.

## Goals completed this session (previous)

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
  - FastAPI `422` validation payloads are currently forwarded through the Next.js proxy unchanged; revisit before broader UI/public exposure.

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

- `dash-004` complete. Next task is `dash-005` (Settings page: `frontend/src/app/settings/page.tsx`).
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
