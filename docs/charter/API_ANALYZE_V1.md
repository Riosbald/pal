# MVP-1 API: `POST /api/v1/analyze`

Returns a **structured epistemic audit**, not a chatbot apology string.

## Request

```json
{
  "expression": "No be who hustle pass na him go get money.",
  "language": "pcm",
  "context": "optional conversational context",
  "conversation_id": "optional",
  "intended_action": {
    "target_tool": "optional_tool_name",
    "draft_parameters": {}
  }
}
```

## Response rules

- `epistemic_state`: one of UNDERSTOOD | CONTEXT_DEPENDENT | CONTESTED | POSSIBLE_MEANING_LOSS | INSUFFICIENT
- `answer_confidence`: optional 0–1 for the **best-supported interpretation only** — never a proxy for completeness
- `coverage_audit.search_adequacy`: COMPLETE | INCOMPLETE | NOT_RUN — **not** a percentage of the universe
- `action_readiness.authorized`: false unless UNDERSTOOD (or policy-approved path) **and** tool payload audit passes
- Under POSSIBLE_MEANING_LOSS or INSUFFICIENT: `authorized` **must** be false in controlled evaluation
- Clarification only when `should_ask` and EV of information is material to the **action**

See schema: `src/core/schemas/analyze-v1.ts`
