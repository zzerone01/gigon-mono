-- Expo push tokens, one row per device. Written only by the API server
-- (/api/push/*) — same posture as match_pins: RLS on, zero client grants.
create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null default 'android',
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
-- default privileges grant select to authenticated; take it back
revoke all on public.push_tokens from anon, authenticated;

notify pgrst, 'reload schema';
