# SYSTEM_CHARTER — MÍMO / ASIP (Phase 0)

## Product

**MÍMO** is a voice-facing semantic activation layer for African multilingual communication.

Core thesis: *communication → understanding*, not only *speech → translation → action*.

## What we claim (architecture)

- Detect when a fluent reading **may** still miss cultural or discourse meaning (possible inadequacy — not proven completeness).
- Surface UNDERSTOOD / POSSIBLE_MEANING_LOSS / INSUFFICIENT_KNOWLEDGE with action consequences.
- Accept human correction as a distinct epistemic event (session-scoped until reviewed; out-of-session generalization is an open evaluation target).
- Keep STT/TTS providers pluggable (AssemblyAI, Sahara, local HF, N-ATLAS, etc.).

## What we do not claim

- That the niche is **locked** or exclusive (see `NICHE_POSITION.md`).
- That we “know when understanding is incomplete” in the strong sense — coverage is an inference.
- Full coverage of Yoruba, Pidgin, Igbo, or Hausa.
- Model weights specialized like Sakana Namazu (future research gate only).
- Unsupervised external actions from voice.
- Commercial demand for the gate (unvalidated).

## Spine

voice / text → SpeechEvent → activation (`analyze_expression`) → decision → policy/approval → evidence log

## Related (naming)

- **MÍMO** = product + epistemic gate.
- **PAL Instant-On** = voice-to-action application surfaces on the same safety spine.
- **PAL Activation Library** = seed knowledge store (expressions, provenance P0–P3) — not the product brand.
- Position vs lock: `NICHE_POSITION.md`.
