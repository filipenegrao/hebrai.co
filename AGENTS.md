# AGENTS.md — Operational Manual for Agents

> This file is mandatory for any agent before acting in the repository.
> Read this file BEFORE any action. This is not optional.

## 1. Project context

See `CLAUDE.md` for product description, stack, folder structure, and commands.
This template is generic: adapt the product placeholders when creating a new project.

## 2. Repository map

| Path | Purpose |
|---|---|
| `CLAUDE.md` | Quick project context, stack and commands |
| `AGENTS.md` | Global operational contract for all agents |
| `HANDOFF.md` | Memory between sessions; must be updated at the end |
| `STATUS.json` | Domain and feature states; source of truth for tracking |
| `docs/architecture.md` | Layers, dependencies and guardrails |
| `docs/dashboard-integration.md` | Optional contract for integration with `Agents Dashboard` |
| `docs/decisions/` | ADRs of the template and project |
| `docs/progress.md` | Optional human checklist |
| `docs/session-log.md` | Append-only history of sessions |
| `harness/prompts/builder.md` | Base prompt for the implementation agent |
| `harness/prompts/qa.md` | Base prompt for the validation agent |
| `harness/prompts/security.md` | Base prompt for the independent security reviewer |
| `harness/prompts/orchestrator.md` | Base prompt for the Builder -> QA -> Security cycle |
| `.github/workflows/harness-ci.yml` | Mandatory quality sensors |
| `.harness/pipeline_run_id` | Optional local state of dashboard integration; do not version |
| `~/.claude/hooks/pipeline-event.sh` | Optional helper to report Agents Dashboard stages |

## 3. Absolute rules

- Never declare a task complete without running the mandatory sensors of the current stack.
- Always prioritize dry-run mode when introducing new automations.
- Always keep a log of decisions and actions applied when the flow requires auditing.
- Always update `HANDOFF.md` at the end of the session.
- Always update `STATUS.json` when a feature status changes.
- If the project uses `docs/session-log.md`, always add an entry at the end of the session.
- Never hardcode credentials, tokens, account IDs, or sensitive URLs.

## 4. Architecture

Refer to `docs/architecture.md` for layers, allowed dependencies and guardrails.
General rule: dependencies flow from left to right between layers. Never import from a layer to the right of yours.

## 5. Mandatory workflow

1. Read `CLAUDE.md`, `AGENTS.md`, `HANDOFF.md` and `STATUS.json`.
2. Select the target feature and confirm an atomic scope.
3. Implement within the correct layers.
4. Run sensors compatible with the stack.
5. Fix failures and run again.
6. Update `HANDOFF.md` and `STATUS.json`.
7. Update `docs/session-log.md` if the project uses it.
8. Deliver objective summary with remaining risks.

## 6. Minimum sensors before completing

Use only commands compatible with the current stack.

```bash
# Python
ruff check .
mypy .
pytest

# Node / React / Next.js
npm run lint
npm run build
# run npm run test only if the repository actually has this script
```

If a sensor fails, do not ignore it. Fix or explicitly document the block in `HANDOFF.md`.
The template does not include by default a reusable structural test for architecture.

## 7. Definition of Done (DoD)

A feature can only be marked as `done` when:

- the implementation respects architecture and guardrails
- the mandatory sensors are green
- the residual risk has been documented
- `HANDOFF.md` has been updated
- `STATUS.json` reflects the real state

## 8. Escalation to human

Escalate immediately when:

- conflict between security and automation
- product uncertainty affecting agent behavior
- need for new scope outside the current feature
- third failure cycle without resolution

## 9. Optional Dashboard

If the project uses `Agents Dashboard`, the integration contract is the versioned set in `agents-dashboard/scripts/`.

Supported variables:

- `PIPELINE_DASHBOARD_URL` to define the dashboard base URL
- `PIPELINE_RUN_ID_FILE` to override the run state file
- `.harness/pipeline_run_id` as default per repository when there is no override

Use the dashboard only as observability of the flow; it does not replace `HANDOFF.md` nor `STATUS.json` as source of truth for the work.
