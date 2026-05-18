# Active QA Review

Paste this content after `harness/prompts/qa.md`.
Updated by Orchestrator at the end of each completed feature.

## PR under review

- Feature ID: foundation-006
- Feature name: Next.js scaffold
- Domain: foundation

## Review objective

Validate that the initial frontend scaffold matches foundation plan Task 6 and does not pull later auth or page behavior forward.

## Expected scope

1. Next.js scaffold under `frontend/`.
2. Tailwind + shadcn/ui setup.
3. `frontend/Dockerfile`.
4. State-doc updates.

## Must not be included in this delivery

1. Better Auth setup.
2. Login/register pages.
3. Route protection or dashboard behavior.
4. Backend business logic.

## Mandatory checklist

1. Scope follows foundation plan Task 6 only.
2. Scaffolded files and versions match the refreshed plan intent.
3. Tailwind and shadcn/ui configuration are present.
4. Dockerfile matches planned production behavior.
5. No unrelated generated or auth-specific files are included.
6. `HANDOFF.md`, `STATUS.json`, `docs/progress.md`, and `docs/session-log.md` are updated consistently.
7. Applicable verification commands were executed and reported.

## Required report format

1. Verdict: `APPROVED` | `REJECTED` | `APPROVED WITH RESERVATIONS`
2. Critical problems (blocking merge)
3. Non-critical problems
4. Residual risks
5. Clear next action for Builder
