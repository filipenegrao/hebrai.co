# Active Builder Task

Paste this content after `harness/prompts/builder.md`.
Updated by Orchestrator at the end of each completed feature.

## Task

- Feature ID: foundation-009
- Feature name: Route protection and dashboard shell
- Domain: foundation
- Goal: Add the planned route-protection proxy and protected dashboard shell exactly as described in foundation plan Task 9.

## Mandatory scope

1. Create the planned proxy for route protection.
2. Replace the default root page with the planned protected dashboard shell.
3. Preserve auth-page work from Task 8 without expanding into later dashboard metrics.
4. Update docs and state:
   - `HANDOFF.md`
   - `STATUS.json`
   - `docs/progress.md`
   - `docs/session-log.md`

## Out of scope

1. Real dashboard metrics.
2. Core-engine session flows.
3. Deployment work.
4. Auth DB migration.

## Acceptance criteria

1. Proxy and dashboard shell match foundation plan Task 9 intent.
2. Public/protected route behavior is represented as planned.
3. No later dashboard features are pulled forward.
4. State docs reflect the real result of this task.
5. Applicable verification commands are executed and reported.

## Constraints

1. Follow `AGENTS.md`.
2. Respect `docs/architecture.md`.
3. No scope creep.
4. No hardcoded credentials, tokens, or secrets.
