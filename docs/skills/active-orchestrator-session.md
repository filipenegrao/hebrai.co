# Active Orchestrator Session

Paste this content at the start of a new Orchestrator conversation.
Updated by Orchestrator at the end of each completed feature.

## Session goal

Run the Builder -> QA -> Security cycle for the current active feature and close
the delivery with validated state docs and repository handoff.

## Read in this exact order

1. AGENTS.md
2. HANDOFF.md
3. STATUS.json
4. docs/architecture.md
5. docs/skills/active-builder-task.md
6. docs/skills/active-qa-review.md
7. docs/skills/active-security-review.md

## Active feature for this session

- Feature ID: foundation-007
- Feature name: Better Auth configuration
- Domain: foundation

## Orchestration steps

1. Trigger Builder using harness/prompts/builder.md + docs/skills/active-builder-task.md.
2. Validate implementation against architecture and scope.
3. Trigger QA using harness/prompts/qa.md + docs/skills/active-qa-review.md.
4. If QA rejects, loop corrections through Builder until approved.
5. Trigger Security using harness/prompts/security.md + docs/skills/active-security-review.md.
6. If Security reports a critical issue, loop corrections through Builder until cleared.
7. Run the verification commands applicable to the implemented scaffold state.
8. Ensure HANDOFF.md and STATUS.json are updated.
9. Commit with Conventional Commits when the user requests it.
10. Push when a remote exists and the user requests publication.
11. Rotate active files for the next feature:
   - docs/skills/active-builder-task.md
   - docs/skills/active-qa-review.md
   - docs/skills/active-security-review.md
   - docs/skills/active-orchestrator-session.md

## Guardrails

1. Do not allow scope creep.
2. Do not skip QA or Security for the active feature.
3. Do not conclude with failing applicable verification.
4. Keep Security advisories visible as backlog unless they become critical.

## Exit criteria

1. QA verdict is approved (or approved with non-blocking notes).
2. Security verdict is clean or advisory only.
3. Applicable verification is complete.
4. Repository state is documented honestly.
5. Next session files are pre-rotated.
