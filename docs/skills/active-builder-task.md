# Active Builder Task

Paste this content after `harness/prompts/builder.md`.
Updated by Orchestrator at the end of each completed feature.

## Task

- Feature ID: foundation-008
- Feature name: Auth pages
- Domain: foundation
- Goal: Add the login/register pages exactly as described in foundation plan Task 8.

## Mandatory scope

1. Create the planned auth UI pages.
2. Reuse the planned Better Auth client helper and shadcn/ui components.
3. Preserve the current auth architecture without adding middleware or dashboard behavior yet.
4. Update docs and state:
   - `HANDOFF.md`
   - `STATUS.json`
   - `docs/progress.md`
   - `docs/session-log.md`

## Out of scope

1. Route-protection middleware.
2. Dashboard shell behavior.
3. Backend/session endpoints.
4. Deployment work.

## Acceptance criteria

1. Auth pages match foundation plan Task 8 intent.
2. Pages use the existing auth client helper correctly.
3. No middleware or later-feature behavior is pulled forward.
4. State docs reflect the real result of this task.
5. Applicable verification commands are executed and reported.

## Constraints

1. Follow `AGENTS.md`.
2. Respect `docs/architecture.md`.
3. No scope creep.
4. No hardcoded credentials, tokens, or secrets.
