# Active QA Review

Paste this content after `harness/prompts/qa.md`.
Updated by Orchestrator at the end of each completed feature.

## PR under review

- Feature ID: foundation-002
- Feature name: Nginx config
- Domain: foundation

## Review objective

Validate that the initial Nginx configuration matches foundation plan Task 2 and does not expose later-task behavior.

## Expected scope

1. `nginx/nginx.conf` creation.
2. Proxying external traffic to the `next` service.
3. State-doc updates for the completed slice.

## Must not be included in this delivery

1. Database schema or seed work.
2. FastAPI, Next.js, auth, or UI implementation.
3. HTTPS/TLS production config from later plans.

## Mandatory checklist

1. Scope follows foundation plan Task 2 only.
2. Nginx routes the intended traffic to `next`.
3. FastAPI remains internal-only and is not exposed through Nginx.
4. No unrelated config or implementation files are added.
5. `HANDOFF.md`, `STATUS.json`, `docs/progress.md`, and `docs/session-log.md` are updated consistently.
6. Applicable verification commands were executed and reported.

## Required report format

1. Verdict: `APPROVED` | `REJECTED` | `APPROVED WITH RESERVATIONS`
2. Critical problems (blocking merge)
3. Non-critical problems
4. Residual risks
5. Clear next action for Builder
