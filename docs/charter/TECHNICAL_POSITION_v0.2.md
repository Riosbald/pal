# MÍMO — Technical Position & Research Thesis v0.2

**Status:** Technical boundary + research hypothesis **frozen for implementation**  
Competitive exclusivity and commercial demand remain **open under continuous validation**

---

## Position

MÍMO is a **representation-assurance layer** for voice and language agents.

It does **not** claim complete cultural understanding.

It evaluates whether the system’s current representation of a speaker’s meaning is:

- sufficiently **supported** by evidence,
- sufficiently **specified** for the task,
- **adequate** for the downstream decision being considered.

When evidence suggests representation may be inadequate, MÍMO can:

- surface alternative interpretations
- identify possible representation gaps
- retrieve supporting or contradictory evidence
- ask **targeted** clarification (only when it would change the action)
- route unresolved cases to a human
- preserve corrections with provenance
- convert confirmed failures into regression tests
- **prevent consequential action** until semantic readiness **and** policy **and** required approval pass

**One-line claim (use this):**

> Before this agent acts, test whether the meaning it is acting on is sufficiently represented and supported.

**Not:** “AI that understands African culture.”

---

## Core thesis

A language model can produce a **locally plausible** interpretation while still using an **inadequate representation** of what the speaker means. Trustworthy voice agents need a mechanism that **challenges their own representation** before converting interpretation into consequential action.

African languages and culturally situated communication (starting with **Yoruba, Nigerian Pidgin, English**) are a **high-signal test environment**, not a single “African culture” ontology.

---

## What MÍMO does not claim

- complete cultural understanding  
- a universal African cultural ontology  
- perfect detection of semantic gaps  
- proof of completeness  
- autonomous determination of cultural truth  
- that every unusual expression is culturally loaded  
- that multiple model outputs constitute independent truth  
- that a benchmark score proves semantic adequacy  
- competitive exclusivity or validated commercial demand  

---

## Epistemic states (system condition, not speaker labels)

| State | Default behavior |
|-------|------------------|
| **UNDERSTOOD** | Continue normal pipeline |
| **CONTEXT_DEPENDENT** | Request only necessary context |
| **CONTESTED** | Preserve competing interpretations |
| **POSSIBLE_MEANING_LOSS** | No consequential autonomous action |
| **INSUFFICIENT** | Clarify / human route |

Hackathon may still surface a three-state UI; the full set is the engineering target.

Independently:

```
semantic readiness
AND policy authorization
AND required human approval
→ action
```

---

## Failure taxonomy (not “doesn’t understand culture”)

| State | Meaning |
|-------|---------|
| UNKNOWN | Evidence insufficient |
| UNDISCOVERED | Relevant possibility never searched |
| UNRECOGNIZED | Signal present but not identified as relevant |
| UNREPRESENTED | Schema lacks adequate category |
| CONTESTED | Multiple legitimate interpretations |
| CONTEXT-DEPENDENT | Meaning shifts with speaker/relation/place/genre/time |
| SPECIFIED | Enough evidence for the **current task** |

---

## Evaluation dimensions (separated)

1. **CORRECTNESS**  
2. **SEARCH ADEQUACY** (routes attempted — not a fake % of the universe)  
3. **REPRESENTATION ADEQUACY**  
4. **SEMANTIC / CULTURAL FIDELITY**  
5. **ACTION READINESS**  

Interpretation quality ≠ semantic sufficiency ≠ action authorization.

**CoverageAudit** records search evidence, e.g.:

```json
{
  "search_routes": ["lexical", "semantic", "cultural_retrieval", "alternative_frame", "counterexample", "human_challenge"],
  "routes_completed": 5,
  "routes_not_run": ["human_challenge"],
  "novel_candidates_found": 3,
  "unresolved_residuals": 2,
  "ontology_challenges": 1,
  "coverage_evidence": "INCOMPLETE"
}
```

Legitimate:

`ANSWER_CONFIDENCE = high` **and** `SEARCH_ADEQUACY = incomplete`

---

## Signature mechanism: Representation Gap Challenge (RGC)

Given source + current interpretation + ontology + evidence, independent routes:

| Route | Purpose |
|-------|---------|
| A | Current semantic interpretation |
| B | Alternative framing |
| C | Source-native / cultural retrieval |
| D | Counterexample search |
| E | Ontology challenge |
| F | Human challenge |

Outcomes: stable interpretation · ambiguity · representation-gap candidate · validated failure (only with evidence/human validation).

**Independence is engineered**, not assumed from “N agents”: different provider/objective/evidence source/retrieval strategy/human challenge/hidden bench where feasible. Same model × five prompts ≠ five independent evaluations.

---

## Metrics (report measured rates, not guarantees)

Gap Detection Precision/Recall · False-UNDERSTOOD · False-INSUFFICIENT · Clarification Utility · Correction Generalization · Correction Overgeneralization · Representation Discovery · Unresolved Residual · **Action Leakage**

Action leakage (controlled eval):

> consequential tool execution under POSSIBLE_MEANING_LOSS / INSUFFICIENT **must be 0** in adversarial suite  

Risk thresholds are **action-class dependent** (with CIs), not fixed “near zero” marketing numbers.

---

## Human knowledge statuses

`MODEL_HYPOTHESIS` · `INDIVIDUAL_CORRECTION` · `SOURCE_DERIVED` · `EXPERT_ATTESTED` · `COMMUNITY_VALIDATED` · `CONTESTED` · `CONTEXT_SPECIFIC` · `RESTRICTED`

Two validators ≠ automatic cultural authority. Corrections never overwrite immutable source; model confidence never upgrades evidence status.

---

## PAL relationship

| Component | Role |
|-----------|------|
| **PAL Activation Library** | Provenance-aware cultural/discourse knowledge + retrieval |
| **MÍMO** | Representation assurance / gap audit / correction / action readiness |
| **PAL Instant-On / agent action** | Draft actions only after semantic readiness + policy + approval |

**Invariant:** PAL knowledge ≠ action authorization.

---

## Research objective

> Can an AI system detect when the semantic representation it is using is inadequate for the decision it is about to make, particularly in linguistically and culturally situated communication?

Initial languages: Yoruba, Naija (Nigerian Pidgin), English — to separate generic ambiguity from representation-specific gaps.

---

## MVP (do not expand before this works)

1. `analyze_expression`  
2. Representation Gap Challenge (minimal: primary + alternative + evidence/counterexample)  
3. Provenance-bearing evidence log  
4. Human correction  
5. Regression case generation  
6. Semantic action gate  
7. PAL retrieval (when needed)  
8. Voice transport (AssemblyAI as interface, not definition of MÍMO)

**Out of MVP:** multi-agent swarm, continental KG, autonomous ontology rewrite, foundation pretraining, continent-wide culture ontology.

**First experiment:** 30–50 case RGC set (ordinary / loaded / ambiguous / unfamiliar / action-bearing).

---

## Four locks (not one binary)

| Lock | Status |
|------|--------|
| Technical boundary | ✅ Frozen for implementation |
| Research hypothesis | ✅ Frozen for testing |
| Competitive position | ⚠️ Continuously test |
| Commercial position | ⚠️ Not validated |

---

## Evidence status

**Supported:** African-language gaps in cultural/speech eval; multilingual abstention/calibration problems; agent action gating research; crowded HEAR/SPEAK market with growing “cultural context” product claims.

**Plausible, unproven:** Reliable representation-gap detection; correction without overgeneralization; audit beats naive confidence; product category “representation assurance before action.”

**Unknown:** Willingness to pay; clarification tolerance; production FP/FN; generalization; competitor equivalence.

---

## Potential compounding asset (not a claimed moat)

Failures → gap cases → human-validated evidence → structured regression → better detection → safer action → more real-world failures → …

---

## Naming note

`MÍMO` / `MiMo` and similar names are occupied in the market (other products/platforms). Treat public brand as an **unresolved product decision**. Engineering/hackathon codename is fine.

---

## Positioning rule

Prefer: **representation assurance before action**  
Avoid: **AI that understands African culture**

The first is a testable engineering thesis. The second is unbounded.
