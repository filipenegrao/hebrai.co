@AGENTS.md

# hebrai.co

## Overview

hebrai.co is a Biblical Hebrew study web app. It combines spaced repetition,
adaptive exercise formats, AI-generated study content, and progress tracking so
learners can build vocabulary through short daily review sessions.

## Stack

- **Frontend**: Next.js 16.2 App Router, React, Node.js 24 LTS, Tailwind CSS 4.3, shadcn/ui
- **Backend**: Python 3.14, FastAPI 0.136.1
- **Storage**: PostgreSQL 18
- **Scheduling**: py-fsrs
- **AI providers**: direct provider SDKs behind an internal adapter, with keys supplied by environment
- **Auth**: Better Auth 1.6.9 in the Next.js app
- **Infra**: Docker Compose, Nginx stable-alpine, later Certbot on VPS

## Folder Structure

```text
hebrai.co/
├── CLAUDE.md
├── AGENTS.md
├── HANDOFF.md
├── STATUS.json
├── docker-compose.yml              # planned in foundation
├── docs/
│   ├── architecture.md
│   ├── design.md
│   ├── progress.md
│   ├── session-log.md
│   ├── superpowers/plans/
│   └── decisions/
├── harness/
│   └── prompts/
├── backend/                        # planned FastAPI app
├── frontend/                       # planned Next.js app
├── database/                       # planned migrations + seed data
├── nginx/                          # planned reverse-proxy config
└── deploy/                         # planned VPS scripts
```

## Docs and state model

- `docs/superpowers/plans/` contains the implementation plans that currently define product scope.
- `docs/architecture.md` stores stable dependency and trust-boundary rules.
- `docs/progress.md` is the human-readable roadmap.
- `docs/session-log.md` is append-only history.
- `STATUS.json` is the canonical feature tracker.

## Common Commands

```bash
# Frontend (once scaffolded)
cd frontend && npm run dev
cd frontend && npm run lint
cd frontend && npm run build

# Backend (once scaffolded)
cd backend && uvicorn main:app --reload
cd backend && pytest

# Full stack (once scaffolded)
docker compose up --build
```

## Conventions

- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- Keep delivery slices atomic and aligned to the implementation plans.
- After completing a feature, update `HANDOFF.md`, `STATUS.json`, and `docs/progress.md` when state changes.
- Append session notes to `docs/session-log.md`.

## References

- [`AGENTS.md`](AGENTS.md) — operational contract
- [`HANDOFF.md`](HANDOFF.md) — current session snapshot
- [`STATUS.json`](STATUS.json) — machine-readable feature tracker
- [`docs/architecture.md`](docs/architecture.md) — layers and guardrails
- [`docs/progress.md`](docs/progress.md) — human-readable roadmap
- [`docs/superpowers/plans/`](docs/superpowers/plans/) — current implementation plans
- [`harness/prompts/`](harness/prompts/) — Builder, QA, Security, Orchestrator prompts
