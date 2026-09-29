# SYSTEM_CHARTER — MÍMO / ASIP (Phase 0)

## Product

**MÍMO** is a voice-facing **representation-assurance** layer for African multilingual communication (test domain: Yoruba, Naija, English).

Core thesis: a model can produce a locally plausible interpretation while still using an inadequate representation of what the speaker means — so agents need a gate before consequential action.

## What we claim (architecture)

- Detect evidence that speech-derived meaning **may** be inadequately represented or specified.
- Surface epistemic states with action consequences (UNDERSTOOD / CONTEXT_DEPENDENT / CONTESTED / POSSIBLE_MEANING_LOSS / INSUFFICIENT).
- Accept human correction as a distinct epistemic event with provenance (not auto-truth).
- Keep STT/TTS providers pluggable.
- Separate interpretation quality, search adequacy, representation adequacy, fidelity, and **action readiness**.

## What we do not claim

- Complete cultural understanding or a universal African ontology.
- Niche exclusivity or validated commercial demand.
- Proof of completeness; coverage is search evidence, not a percentage of the universe.
- That multiple LLM opinions are independent by default.
- Unsupervised external actions from voice.

## Spine

voice / text → SpeechEvent → MÍMO representation assurance → PAL knowledge (optional) → policy/approval → execution → evidence / failure archive

## Naming

- **MÍMO** = representation assurance + product experience
- **PAL Activation Library** = provenance-aware knowledge store
- **PAL Instant-On** = action surfaces (draft only after readiness)

Canonical freeze: `TECHNICAL_POSITION_v0.2.md` · Evidence: `EVIDENCE_PLAN.md` · Position summary: `NICHE_POSITION.md`
