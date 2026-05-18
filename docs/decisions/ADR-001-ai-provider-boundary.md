# ADR-001 — Use direct provider SDKs behind an internal adapter

## Status

Accepted — 2026-05-17

## Context

The original plans used LiteLLM as the multi-provider abstraction layer for AI content generation. Before backend implementation began, we re-evaluated that choice against the product shape and dependency baseline.

hebrai.co currently needs a narrow AI surface:

- generate structured study content
- support a small set of providers
- keep provider choice user-configurable later
- remain testable and swappable without spreading provider logic through the app

At the same time, the project wants to stay on current stable runtime versions and avoid unnecessary dependency weight before the AI path is actually implemented.

## Decision

Use direct provider SDKs behind an internal adapter boundary owned by this codebase.

Planned shape:

- provider-specific clients live behind an internal module such as `ai_providers.py`
- application-facing orchestration remains in `ai_service.py`
- the rest of the backend depends on our adapter interface, not on provider SDKs directly
- initial provider implementations may target Anthropic, OpenAI, and Google Gen AI SDKs

Do not use LiteLLM as the default abstraction layer for the initial product implementation.

## Consequences

### Positive

- Preserves Python 3.14 compatibility with currently supported official SDKs.
- Keeps the production dependency surface smaller and easier to audit.
- Makes provider behavior explicit in our own codebase.
- Allows us to swap internals later without changing the rest of the app if the adapter boundary is kept narrow.

### Trade-offs

- We own a small amount of provider-normalization code ourselves.
- Adding a new provider requires implementing another adapter rather than only changing config.
- If the AI layer becomes much broader later, we may revisit a richer abstraction such as Pydantic AI.

## Follow-up rules

- Keep Task 5 minimal: only install dependencies the health-check stub actually needs.
- Add official provider SDKs only in the core-engine task that first uses them.
- Re-check provider SDK versions at implementation time and pin them explicitly.
