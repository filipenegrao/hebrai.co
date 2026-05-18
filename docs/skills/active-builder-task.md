# Active Builder Task

Paste this content after `harness/prompts/builder.md`.
Updated by Orchestrator at the end of each completed feature.

## Task

- Feature ID: foundation-007
- Feature name: Better Auth configuration
- Domain: foundation
- Goal: Configure Better Auth exactly as described in foundation plan Task 7, while first resolving the mandatory preconditions carried from the frontend scaffold review.

## Mandatory preconditions from foundation-006 review

1. Audit `@better-auth/client`; if Task 7 can use the stable `better-auth/client` sub-path from the main `better-auth` package as planned, remove the separate pre-alpha package.
2. Move `shadcn` from production `dependencies` to `devDependencies`.
3. Update `frontend/CLAUDE.md` so frontend-scoped agents also load the root operational contract.

## Mandatory scope

1. Create the planned Better Auth server config.
2. Create the planned browser client helper using the stable import path from the main `better-auth` package unless a different choice is explicitly justified.
3. Create the planned auth route handler.
4. Generate / apply the planned Better Auth schema only if tooling/runtime is available and the task instructions allow it.
5. Update docs and state:
   - `HANDOFF.md`
   - `STATUS.json`
   - `docs/progress.md`
   - `docs/session-log.md`

## Out of scope

1. Login/register pages.
2. Route-protection middleware.
3. Dashboard behavior.
4. Core-engine session logic.

## Acceptance criteria

1. The preconditions above are resolved before auth implementation is considered complete.
2. Better Auth config matches foundation plan Task 7 intent.
3. Browser client code uses the intended stable import path.
4. No auth pages or later-feature behavior are pulled forward.
5. State docs reflect the real result of this task.
6. Applicable verification commands are executed and reported.

## Constraints

1. Follow `AGENTS.md`.
2. Respect `docs/architecture.md`.
3. No scope creep.
4. No hardcoded credentials, tokens, or secrets.
