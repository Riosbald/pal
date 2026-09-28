# Activation seed (MÍMO / PAL)

Runtime **activation fuel** — not model training data, not community ground truth.

## Packages

| File | Role |
|------|------|
| `seed/v0.2_balanced_ng.json` | Default balanced seed (pcm / yor / ibo / hau), P1 only |
| `seed/v0.1_balanced_ng.json` | Earlier package (kept for regression) |

## Status ladder

- **P0** model hypothesis
- **P1** source-derived (HF / documented corpora)
- **P2** human-reviewed
- **P3** community-validated

Nothing in seed is auto-promoted to P3.

## Runtime

`loadActivationSeed()` → `analyzeExpression` → three demo states → optional `saveCorrection` (session_accepted only).
