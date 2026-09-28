# AssemblyAI ↔ MÍMO Activation Wiring

## Architecture

```
User speech
    → AssemblyAI Voice Agent (STT + LLM + TTS)
    → tool.call: analyze_expression | save_correction
    → MÍMO POST /api/activation/tools  (or client handleActivationToolCall)
    → tool.result: demo_state + speak_guidance
    → Agent speaks (clarify / abstain / short answer)
```

STT is transport. Activation is the product.

## Endpoints

| Method | Path | Role |
|--------|------|------|
| `POST` | `/api/activation/analyze` | Direct analysis + evidence fields |
| `POST` | `/api/activation/tools` | Dispatch `{ name, arguments, call_id }` |
| `GET` | `/api/activation/tools` | Tool definitions + system prompt |

## Agent config

See `docs/charter/mimo-assemblyai-agent.json`.

Register tools on session:

```json
{ "type": "session.update", "session": { "tools": [ /* from GET /api/activation/tools */ ] } }
```

## Tool call handling (client-side)

1. On `tool.call`: parse `name`, `arguments`, `call_id`.
2. `POST /api/activation/tools` with that body (or call `handleActivationToolCall` in-process).
3. Accumulate results; send `tool.result` after `reply.done` (AssemblyAI timing rule).

## HTTP tools (server-side)

If the agent is public HTTPS:

```ts
import { getMimoActivationHttpTools } from "@/providers/assemblyai-tools";
const tools = getMimoActivationHttpTools("https://your-deploy.example");
```

AssemblyAI POSTs to `/api/activation/analyze` for you.

## Demo script (judge path)

1. User: *“A kì í fi ẹyẹlé sọ ilé.”*
2. Agent calls `analyze_expression`.
3. Result: `POSSIBLE_MEANING_LOSS`.
4. Agent asks if they mean “don’t entrust security to someone unreliable.”
5. User explains → `save_correction` → session_accepted.

## Env

- `ASSEMBLYAI_API_KEY` — for live Voice Agent sessions (not required for unit tests).
