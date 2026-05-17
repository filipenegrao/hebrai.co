# Active Security Review

Paste this content after `harness/prompts/security.md`.
Updated by Orchestrator at the end of each completed feature.

## PR under review

- Feature ID: foundation-002
- Feature name: Nginx config
- Domain: foundation

## Review objective

Validate that the initial reverse-proxy config preserves the intended exposure boundaries.

## Expected scope

1. `nginx/nginx.conf` reverse-proxy behavior.
2. Public exposure only through Nginx.
3. Preservation of FastAPI internal-only topology.

## Must not be included in this delivery

1. Full production TLS review from later deployment work.
2. Runtime security review of code that does not exist yet.
3. Broad review outside the Task 2 diff.

## Mandatory checklist

1. Nginx exposes only the intended public surface.
2. FastAPI is not routed publicly.
3. No secrets or sensitive values are introduced.
4. Proxy configuration does not add obvious unsafe behavior within the reviewed scope.
5. Security-relevant residual risks are documented.
6. Applicable verification commands were executed and reported.

## Required report format

1. Verdict: `CLEAN` | `ADVISORY` | `CRITICAL`
2. Critical findings (blocking merge)
3. Advisories
4. Residual risks
5. Sensors
6. Clear next action for Builder or Orchestrator
