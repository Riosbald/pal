# MÍMO Architecture & Strategy Source of Truth v0.3

**Locked:** 2026-09-29

This is the definitive product/architecture freeze for implementation.

| Document | Role |
|----------|------|
| `TECHNICAL_POSITION_v0.2.md` | Technical boundary + research thesis |
| `API_ANALYZE_V1.md` | MVP-1 response contract (`POST /api/v1/analyze`) |
| `EVIDENCE_PLAN.md` | What must be measured before “moat” language |
| `data/evaluation/rgc_set_v0.1.json` | First Representation Gap Challenge cases |

## One-line claim

> Before this agent acts, test whether the meaning it is acting on is sufficiently represented and supported.

## Three structural locks

1. **CoverageAudit** (not fabricated coverage confidence %)
2. **Five epistemic states** with action semantics
3. **action_readiness** including **tool_payload_audit** (Lost in Execution)

## Invariant

```
semantic readiness AND policy authorization AND required human approval → action
```
