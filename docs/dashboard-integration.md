# Agents Dashboard Integration

The `Agents Dashboard` is a local real-time monitor for the Builder / QA / Security / Orchestrator pipeline.
It tracks stage transitions, agent hand-offs, and git lifecycle events in a browser UI.

Integration is **optional** — all hook scripts are no-ops if the dashboard is not running.

---

## Source of truth

The canonical integration contract lives in `agents-dashboard/scripts/`.
The versioned dashboard repo remains the source of truth.

---

## Setup

### 1. Clone and start the dashboard

In the `combo-harness` monorepo:

```bash
cd ~/combo-harness/agents-dashboard
npm install
npm run dev
```

Standalone clone:

```bash
cd ~/agents-dashboard
npm install
npm run dev
```

By default the dashboard runs at `http://localhost:3000`.

### 2. Install hook scripts

Preferred: symlink the versioned scripts from `agents-dashboard/scripts/`:

```bash
mkdir -p ~/.claude/hooks
ln -sf ~/combo-harness/agents-dashboard/scripts/pipeline-event.sh ~/.claude/hooks/pipeline-event.sh
ln -sf ~/combo-harness/agents-dashboard/scripts/pipeline-bash-detect.sh ~/.claude/hooks/pipeline-bash-detect.sh
ln -sf ~/combo-harness/agents-dashboard/scripts/pipeline-stop.sh ~/.claude/hooks/pipeline-stop.sh
```

If you use a standalone dashboard clone, point those symlinks at that clone instead.

### 3. Register hooks in Claude settings

Add to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse[Bash]": [
      {
        "type": "command",
        "command": "~/.claude/hooks/pipeline-bash-detect.sh"
      }
    ],
    "Stop": [
      {
        "type": "command",
        "command": "~/.claude/hooks/pipeline-stop.sh"
      }
    ]
  }
}
```

---

## Pipeline stages

```text
idle -> planning -> delegated_to_builder -> builder_working ->
sent_to_qa -> qa_reviewing -> sent_to_security -> security_reviewing ->
final_check -> committed -> done
```

| Stage | Triggered by |
|-------|-------------|
| `planning` | Manual — start of orchestrator session |
| `delegated_to_builder` | Manual — before handing off to builder |
| `builder_working` | Manual — while builder is implementing |
| `sent_to_qa` | Manual — before handing off to QA |
| `qa_reviewing` | Manual — while QA is reviewing |
| `sent_to_security` | Manual — before handing off to Security |
| `security_reviewing` | Manual — while Security is reviewing |
| `final_check` | Manual — orchestrator reviewing builder output |
| `committed` | Auto — detected on `git commit` |
| `done` | Auto — detected on `git push` |

---

## Firing events manually

Use the helper script to POST stage transitions:

```bash
~/.claude/hooks/pipeline-event.sh <stage> <agent_role> [tool] [notes] [title] [model]
```

### Starting a new task

Always start with `planning` so a new pipeline run is created:

```bash
~/.claude/hooks/pipeline-event.sh planning orchestrator claude-code "Starting plan" "my-project: login page" "claude-sonnet-4-6"
```

The fifth argument (`title`) names the run in the dashboard, and the sixth argument (`model`) specifies which AI model is being used. Subsequent events can omit the title but may include the model.
The active run ID is persisted at `.harness/pipeline_run_id` by default for git-backed repos, with a `${TMPDIR:-/tmp}/.pipeline_run_id` fallback outside git.

### Multi-project behavior

A single dashboard instance can accept events from many scaffolded projects.
Each git repo keeps its own local `.harness/pipeline_run_id`, so runs do not collide across projects even when they share one dashboard process.

### Full cycle example

```bash
~/.claude/hooks/pipeline-event.sh planning orchestrator claude-code "Scoping task" "my-project: auth" "claude-sonnet-4-6"
~/.claude/hooks/pipeline-event.sh delegated_to_builder orchestrator claude-code "Sent to builder" "" "auth-001" "claude-sonnet-4-6"
~/.claude/hooks/pipeline-event.sh builder_working builder cursor "Implementing" "" "auth-001" "qwen2.5-coder-32b"
~/.claude/hooks/pipeline-event.sh sent_to_qa orchestrator claude-code "Sent to QA" "" "auth-001" "claude-sonnet-4-6"
~/.claude/hooks/pipeline-event.sh qa_reviewing qa github-copilot "Reviewing" "" "auth-001" "gpt-4o"
~/.claude/hooks/pipeline-event.sh sent_to_security orchestrator claude-code "Sent to Security" "" "auth-001" "claude-sonnet-4-6"
~/.claude/hooks/pipeline-event.sh security_reviewing security security-agent "Reviewing" "" "auth-001" "security-specialist"
~/.claude/hooks/pipeline-event.sh final_check orchestrator claude-code "Reviewing output" "" "auth-001" "claude-sonnet-4-6"
```

Known model IDs per tool:
- claude-code: claude-opus-4-6, claude-sonnet-4-6
- cursor/antigravity: qwen2.5-coder-32b, qwen-coder-turbo
- github-copilot: gpt-4o, gpt-4o-mini
- security-agent: security-specialist

`git commit` and `git push` are auto-detected by the bash hook when installed.

---

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `PIPELINE_DASHBOARD_URL` | `http://localhost:3000` | Dashboard base URL |
| `PIPELINE_RUN_ID_FILE` | `<git-root>/.harness/pipeline_run_id` | Persisted current run ID |

All scripts check dashboard connectivity with a 1s timeout and exit silently if unreachable.
