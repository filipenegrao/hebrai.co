# Architecture

## System shape

hebrai.co is a monorepo web application with three main runtime surfaces:

1. `frontend/` — Next.js app for auth, dashboard, settings, and study-session UI.
2. `backend/` — FastAPI service for scheduling, content generation, settings, and stats.
3. `database/` — PostgreSQL schema and seed data shared by the two services.

Nginx fronts the deployed web app. FastAPI is intended to stay internal behind
service-to-service calls from the Next.js app.

## Dependency direction

### Backend

```text
models -> db -> services -> routers -> main
```

- `models`: Pydantic request/response contracts.
- `db`: connection management and DB dependencies.
- `services`: scheduling and AI-content domain logic.
- `routers`: HTTP orchestration only; no duplicated business rules.
- `main`: app composition.

### Frontend

```text
lib -> components -> app routes/pages
```

- `lib`: shared clients, auth helpers, typed fetch wrappers.
- `components`: reusable UI building blocks.
- `app`: route handlers and page-level orchestration.

## Forbidden dependencies

- Backend services must not import routers or app composition.
- Frontend shared `lib` code must not depend on page components.
- Route handlers should not reimplement scheduling or AI-generation business logic.
- Direct browser access to FastAPI is not part of the planned architecture; Next.js API routes proxy authenticated requests.

## Domain mapping

| Domain | Scope |
|---|---|
| `foundation` | Repo scaffold, Docker, auth, DB schema, initial shell |
| `core-engine` | Session flow, FSRS scheduling, AI content, exercise UI |
| `dashboard-deploy` | Metrics, settings, typography, production deployment |

## Runtime flow

1. The user authenticates through Better Auth in Next.js.
2. The browser calls Next.js routes/pages.
3. Next.js API routes attach the authenticated `user_id` and proxy requests to FastAPI.
4. FastAPI reads/writes PostgreSQL, runs FSRS scheduling, and generates cached AI study content.
5. The frontend renders session, dashboard, and settings experiences from typed responses.

## Safety and quality guardrails

- Never hardcode credentials, tokens, provider keys, or production secrets.
- Keep FastAPI internal-only unless an explicit architecture decision changes that.
- Preserve authentication boundaries when proxying user-specific requests.
- Prefer dry-run behavior when introducing automation or deployment scripts.
- Keep AI generation behind service boundaries and cache generated content where planned.
- Treat SQL and user identifiers as trust-boundary surfaces; use parameterized access patterns.

## Testing strategy

- Backend unit tests for FSRS and AI services.
- Backend router tests for API behavior and auth-header requirements.
- Frontend component and route tests where practical.
- Docker Compose smoke tests for cross-service wiring.
- Sensor set should match the actual scaffolded stack as it comes online.
