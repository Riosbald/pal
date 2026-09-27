# PAL Execution Plan

> **Status: ACTIVE.** Implementation phases, each broken into issue-sized tasks. Agents: take one task, complete it fully, update this file.

## Phase 0 — Foundations

- [x] Task 0.1: Repository setup, tooling, CI scaffold (Complete)

## Phase 1 — Voice Ingestion Pipeline

- [x] Task 1.1: Voice ingestion pipeline (Complete)
  - **Goal**: Implement microphone → PCM16 audio → Sahara streaming → SpeechEvent → persisted session state
  - **Scope**: `supabase/migrations/0002_voice_ingestion.sql`, `src/providers/`, `src/services/voice/`, `src/app/api/voice/`, `src/lib/audio/`, `tests/unit/voice-ingestion.test.ts`
  - **Acceptance criteria**: PCM16 16kHz mono, server-side Sahara credentials, partial/final transcripts, provenance, code-switch metadata, workspace tenancy, protocol and mocked integration tests
  - **Depends on**: Task 0.1

## Phase 2 — Semantic Agent

- [x] Task 2.1: Semantic agent (SpeechEvent → MeaningState) (Complete)

## Phase 3 — Integration

- [x] Task 3.1: Workflow agent (MeaningState → ActionPlan) (Complete)
- [x] Task 3.2: Policy engine (ActionPlan → ActionProposal) (Complete)
- [x] Task 3.3: Approval UI and flow (Complete)
- [x] Task 3.4: Execution service (Complete)
- [x] Task 3.5: Verification agent (Complete)

## Phase 4 — Benchmark & Hardening

- [ ] Task 4.1: Dataset integration and benchmark infrastructure
- [ ] Task 4.2: Challenge submission materials
- [ ] Task 4.3: Production WebSocket deployment strategy
- [ ] Task 4.4: Audio quality monitoring and diagnostics

## Phase 5 — Instant-On Mobile App Layer

- [x] Task 5.1: Mobile context contract and deterministic routing
  - **Goal**: Validate mobile app mode metadata and route it to the existing PAL agents without granting execution authority.
  - **Scope**: `src/core/schemas/mobile-context.ts`, `src/services/mobile/context-router.ts`, `supabase/migrations/0009_mobile_context.sql`, `tests/unit/mobile-context.test.ts`, `docs/PAL_DOMAIN_MODEL.md`.
  - **Acceptance criteria**:
    - [x] App modes are validated: quick action, meeting, post-call, pocket, field ops, research, health.
    - [x] Screen, connectivity, OS, version, and workspace/session boundaries are validated.
    - [x] Risk baselines are deterministic and cannot be lowered by client metadata.
    - [x] Routing returns agent/capabilities only; policy, approval, and execution remain separate.
    - [x] Workspace-scoped migration with RLS is included.
  - **Depends on**: Task 1.1, Phase 3 safety gates
  - **Refs**: `docs/PAL_INSTANT_ON_ARCHITECTURE.md`, `docs/PAL_DOMAIN_MODEL.md`, `docs/PAL_SECURITY.md`

- [ ] Task 5.2: Authenticated mobile session bootstrap and WebSocket handoff
- [ ] Task 5.3: Offline audio queue and connectivity-aware synchronization
- [ ] Task 5.4: Voice-to-workflow draft compiler
- [ ] Task 5.5: Meeting mode CRM extraction proposal
- [ ] Task 5.6: Collections scheduling with quiet-hours enforcement
- [ ] Task 5.7: Voice forms and field-operations proposals
- [ ] Task 5.8: Research/TTS and market-intelligence read paths
- [ ] Task 5.9: Vision capture and health-data isolation review

## Task template (GitHub-issue style)

```markdown
## Task <phase>.<n>: <title>
**Goal:** one-sentence outcome
**Scope:** files/components touched
**Acceptance criteria:**
- [ ] ...
**Depends on:** Task x.y
**Refs:** PAL_ARCHITECTURE.md §, PAL_DOMAIN_MODEL.md §
```
