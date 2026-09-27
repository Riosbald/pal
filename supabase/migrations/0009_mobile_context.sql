-- 0009_mobile_context.sql
-- Instant-On mobile context metadata. This migration records routing context only;
-- it does not create an execution path or bypass existing policy/approval gates.

create table public.mobile_contexts (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.voice_sessions(session_id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  app_mode text not null check (app_mode in ('quick_action', 'meeting', 'post_call', 'pocket', 'field_ops', 'research', 'health')),
  screen_state text not null check (screen_state in ('locked', 'unlocked', 'off')),
  connectivity text not null check (connectivity in ('wifi', 'cellular', 'none')),
  device_os text not null check (device_os in ('ios', 'android', 'web', 'other')),
  app_version text not null check (length(trim(app_version)) between 1 and 50),
  risk_baseline numeric not null check (risk_baseline between 0 and 5),
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index mobile_contexts_workspace_idx on public.mobile_contexts(workspace_id);
create index mobile_contexts_session_idx on public.mobile_contexts(session_id);

alter table public.mobile_contexts enable row level security;

create policy "workspace members can read mobile contexts"
  on public.mobile_contexts for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "workspace members can create mobile contexts"
  on public.mobile_contexts for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id));

grant select, insert on public.mobile_contexts to authenticated;
