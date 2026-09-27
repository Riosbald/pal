-- 0010_mobile_session_bootstrap.sql
-- Adds the authenticated mobile bootstrap contract to the existing voice session API.
-- The mobile client receives PAL API endpoints; Sahara credentials remain server-only.

-- 0009 stores the complete context in mobile_contexts. This index makes the
-- bootstrap lookup deterministic without duplicating mode state on voice_sessions.
create index if not exists mobile_contexts_workspace_captured_idx
  on public.mobile_contexts (workspace_id, captured_at desc);

comment on table public.mobile_contexts is
  'Authenticated mobile ingestion context. Routing metadata only; never an execution authorization.';
