## MobileContext

The Instant-On mobile layer introduces a validated, workspace-scoped routing context attached to each voice session.

| Field | Type | Constraints |
|---|---|---|
| sessionId | string | non-empty; references a voice session |
| workspaceId | string | non-empty; must satisfy workspace membership/RLS |
| appMode | enum | quick_action \| meeting \| post_call \| pocket \| field_ops \| research \| health |
| screenState | enum | locked \| unlocked \| off |
| connectivity | enum | wifi \| cellular \| none |
| deviceOs | enum | ios \| android \| web \| other |
| appVersion | string | non-empty |
| riskBaseline | number | 0..5; server-configured and never lowered by client metadata |
| capturedAt | string | ISO-8601 timestamp |

Mobile context selects an existing PAL agent and capabilities. It does not approve proposals, execute actions, schedule jobs, or bypass policy. Mobile voice sessions use the authenticated `/api/voice/sessions`, `/api/voice/audio`, and `/api/voice/commit` endpoints; provider credentials remain server-side.
