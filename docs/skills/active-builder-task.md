# Active Builder Task

Paste this content after `harness/prompts/builder.md`.
Updated by Orchestrator at the end of each completed feature.

## Task

- Feature ID: foundation-006
- Feature name: Next.js scaffold
- Domain: foundation
- Goal: Add the initial Next.js frontend scaffold with Tailwind and shadcn/ui exactly as described in foundation plan Task 6.

## Mandatory scope

1. Create the planned Next.js app under `frontend/`.
2. Configure Tailwind CSS and shadcn/ui according to the foundation plan.
3. Create the planned production `frontend/Dockerfile`.
4. Preserve the refreshed frontend baseline from the plan.
5. Update docs and state:
   - `HANDOFF.md`
   - `STATUS.json`
   - `docs/progress.md`
   - `docs/session-log.md`

## Out of scope

1. Better Auth configuration.
2. Login/register pages.
3. Route protection or dashboard behavior.
4. Backend/session implementation.

## Acceptance criteria

1. The frontend scaffold matches foundation plan Task 6 intent.
2. Tailwind and shadcn/ui setup are present as planned.
3. The Dockerfile matches the planned production build strategy.
4. No auth or later-feature work is pulled forward.
5. State docs reflect the real result of this task.
6. Applicable verification commands are executed and reported.

## Constraints

1. Follow `AGENTS.md`.
2. Respect `docs/architecture.md`.
3. No scope creep.
4. No hardcoded credentials, tokens, or secrets.
