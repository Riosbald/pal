# SYSTEM_CHARTER — MÍMO / ASIP (Phase 0)

## Product

**MÍMO** is a voice-facing semantic activation layer for African multilingual communication.

Core thesis: *communication → understanding*, not only *speech → translation → action*.

## What we claim

- Detect when a fluent reading may still miss cultural or discourse meaning.
- Surface UNDERSTOOD / POSSIBLE_MEANING_LOSS / INSUFFICIENT_KNOWLEDGE.
- Accept human correction as a distinct epistemic event (session-scoped until reviewed).
- Keep STT/TTS providers pluggable (AssemblyAI, Sahara, local HF, N-ATLAS, etc.).

## What we do not claim

- Full coverage of Yoruba, Pidgin, Igbo, or Hausa.
- Model weights specialized like Sakana Namazu (future research gate only).
- Unsupervised external actions from voice.

## Spine

voice / text → SpeechEvent → activation (`analyze_expression`) → decision → policy/approval → evidence log

## Related

- PAL Instant-On modules = application surfaces on the same safety spine.
- PAL (Proverb Activation Library) = cultural ontology / seed activation store.
