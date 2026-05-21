# Progress

> Human-readable roadmap. Canonical task state is `STATUS.json`.

Updated: 2026-05-20

## In progress

(None)

## Backlog

### Core engine
- [x] `core-001` — Backend infrastructure (db.py, models.py, tests/conftest.py)
- [x] `core-002` — FSRS scheduling service (fsrs_service.py, test_fsrs_service.py)
- [x] `core-003` — AI content generation service (ai_service.py, test_ai_service.py)
- [x] `core-004` — Session router (session_router.py, test_session_router.py, main.py wired)
- [x] `core-005` — Session proxy routes (Next.js API routes + api.ts helpers)
- [x] `core-006` — HebrewWord component
- [x] `core-007` — Exercise UI components
- [x] `core-008` — Session page
- [x] `core-009` — End-to-end smoke test hardening and verification

### Dashboard and deploy
- [ ] `dash-001` to `dash-009` — Dashboard, settings, typography, and deployment plan

## Done

- [x] Foundation section closed (`foundation-001` to `foundation-010`)
- [x] Core engine section closed (`core-001` to `core-009`)
- [x] `foundation-010` — Full stack smoke test
- [x] `foundation-009` — Route protection and dashboard shell
- [x] `foundation-008` — Auth pages
- [x] `foundation-007` — Better Auth configuration
- [x] `foundation-006` — Next.js scaffold
- [x] `foundation-005` — FastAPI stub
- [x] `foundation-004` — Hebrew seed data and import script
- [x] `foundation-003` — PostgreSQL schema migration
- [x] `foundation-002` — Nginx config
- [x] `foundation-001` — Project scaffold
- [x] Harness updated for Builder -> QA -> Security workflow
