# Active Builder Task

Paste this content after `harness/prompts/builder.md`.
Updated by Orchestrator at the end of each completed feature.

## Task

- Feature ID: foundation-002
- Feature name: Nginx config
- Domain: foundation
- Goal: Add the initial reverse-proxy configuration exactly as described in foundation plan Task 2.

## Mandatory scope

1. Create `nginx/nginx.conf` following `docs/superpowers/plans/2026-05-17-foundation.md` Task 2.
2. Configure Nginx to proxy `/` traffic to the `next` service.
3. Preserve the intended topology where FastAPI remains internal-only and is not exposed via Nginx in this plan.
4. Update docs and state:
   - `HANDOFF.md`
   - `STATUS.json`
   - `docs/progress.md`
   - `docs/session-log.md`

## Out of scope

1. PostgreSQL schema or seed work.
2. FastAPI implementation.
3. Next.js or auth implementation.
4. HTTPS/TLS deployment configuration from the later dashboard/deploy plan.

## Acceptance criteria

1. `nginx/nginx.conf` matches the foundation plan Task 2 intent.
2. Root traffic is proxied to the `next` service.
3. FastAPI is still not publicly routed.
4. State docs reflect the real result of this task.
5. Applicable verification commands are executed and reported.

## Constraints

1. Follow `AGENTS.md`.
2. Respect `docs/architecture.md`.
3. No scope creep.
4. No hardcoded credentials, tokens, or secrets.
