-- Chat read receipts (feedback 2026-07-10): one row per participant per
-- match holding when they last had the chat open. The sender's client shows
-- "Read" on messages older than the other side's last_read_at — no
-- per-message writes, KakaoTalk-style.
--
-- RLS posture (standing rule): readable by authenticated, ZERO write
-- policies — writes go through POST /api/matches/[id]/read only.

create table if not exists public.chat_reads (
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

alter table public.chat_reads enable row level security;

drop policy if exists chat_reads_select on public.chat_reads;
create policy chat_reads_select on public.chat_reads
  for select to authenticated using (true);

grant select on public.chat_reads to authenticated;

-- Live receipt updates for the open chat UIs
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'chat_reads'
  ) then
    alter publication supabase_realtime add table public.chat_reads;
  end if;
end $$;
