-- Simplified RLS posture (owner decision, 2026-07-02):
-- RLS stays ENABLED on every table so the Supabase security advisor stays
-- quiet, but row rules are NOT the authorization layer. Reads are open to
-- any signed-in user; every write goes through SECURITY DEFINER RPCs that
-- check auth.uid() in code. Secrets (PIN hashes) move to a client-
-- inaccessible table instead of relying on row rules.

-- ---------- drop the fine-grained policies ----------
drop policy if exists "profiles are readable by signed-in users" on public.profiles;
drop policy if exists "own profile is updatable" on public.profiles;
drop policy if exists "open gigs are readable" on public.gigs;
drop policy if exists "applications visible to applicant and gig owner" on public.applications;
drop policy if exists "matches visible to participants" on public.matches;
drop policy if exists "billable events visible to the employer" on public.billable_events;
drop policy if exists "messages visible to participants" on public.messages;
drop policy if exists "reviews are readable by signed-in users" on public.reviews;
drop policy if exists "disputes visible to participants" on public.disputes;

-- ---------- uniform signed-in read access (no row rules) ----------
create policy "authenticated read" on public.profiles for select to authenticated using (true);
create policy "authenticated read" on public.gigs for select to authenticated using (true);
create policy "authenticated read" on public.applications for select to authenticated using (true);
create policy "authenticated read" on public.matches for select to authenticated using (true);
create policy "authenticated read" on public.billable_events for select to authenticated using (true);
create policy "authenticated read" on public.messages for select to authenticated using (true);
create policy "authenticated read" on public.reviews for select to authenticated using (true);
create policy "authenticated read" on public.disputes for select to authenticated using (true);
-- invite_codes / audit_log / match_pins: intentionally no policies (RPC-only).

-- Direct profile updates are closed too — RPCs only.
revoke update on public.profiles from authenticated;

-- ---------- move PIN secrets out of client reach ----------
-- With open reads, a bcrypt hash of a 4-digit PIN would be trivially
-- brute-forced offline; keep the hash in a table the API roles can't read.
create table public.match_pins (
  match_id uuid primary key references public.matches (id) on delete cascade,
  pin_hash text not null,
  issued_at timestamptz not null default now(),
  attempts integer not null default 0,
  locked_until timestamptz
);
alter table public.match_pins enable row level security;
revoke all on public.match_pins from anon, authenticated;

insert into public.match_pins (match_id, pin_hash, issued_at, attempts, locked_until)
select id, pin_hash, coalesce(pin_issued_at, now()), pin_attempts, pin_locked_until
from public.matches
where pin_hash is not null;

alter table public.matches
  drop column pin_hash,
  drop column pin_attempts,
  drop column pin_locked_until;
-- matches.pin_issued_at stays — non-secret, drives the "waiting for PIN" UI.

-- ---------- PIN RPCs now read/write match_pins ----------
create or replace function public.issue_pin(p_match uuid)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare v_pin text;
begin
  if not exists (
    select 1 from public.matches
    where id = p_match and employer_id = auth.uid() and status = 'IN_PROGRESS'
  ) then
    raise exception 'match not in IN_PROGRESS state';
  end if;
  v_pin := lpad((floor(random() * 10000))::int::text, 4, '0');
  insert into public.match_pins (match_id, pin_hash, issued_at, attempts, locked_until)
  values (p_match, crypt(v_pin, gen_salt('bf')), now(), 0, null)
  on conflict (match_id) do update
    set pin_hash = excluded.pin_hash, issued_at = now(), attempts = 0, locked_until = null;
  update public.matches set pin_issued_at = now() where id = p_match;
  perform public.audit('pin_issued', null, p_match, '{}');
  return v_pin;
end;
$$;

create or replace function public.verify_pin(p_match uuid, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare m record; pins record;
begin
  select * into m from public.matches where id = p_match and worker_id = auth.uid();
  if m is null then raise exception 'match not found'; end if;
  if m.status <> 'IN_PROGRESS' then raise exception 'match not in IN_PROGRESS state'; end if;

  select * into pins from public.match_pins where match_id = p_match;
  if pins is null or pins.issued_at < now() - interval '24 hours' then
    return jsonb_build_object('ok', false, 'error', 'no_active_pin');
  end if;
  if pins.locked_until is not null and pins.locked_until > now() then
    return jsonb_build_object('ok', false, 'error', 'locked',
      'locked_for', ceil(extract(epoch from pins.locked_until - now())));
  end if;

  if pins.pin_hash = crypt(p_pin, pins.pin_hash) then
    update public.matches set status = 'COMPLETED', completed_at = now() where id = p_match;
    update public.gigs set status = 'COMPLETED' where id = m.gig_id;
    update public.profiles set jobs_completed = jobs_completed + 1 where id = m.worker_id;
    delete from public.match_pins where match_id = p_match;
    perform public.audit('pin_verified_completed', m.gig_id, p_match, '{}');
    return jsonb_build_object('ok', true);
  end if;

  if pins.attempts + 1 >= 3 then
    update public.match_pins set attempts = 0, locked_until = now() + interval '60 seconds'
    where match_id = p_match;
    perform public.audit('pin_locked', null, p_match, '{}');
    return jsonb_build_object('ok', false, 'error', 'locked', 'locked_for', 60);
  else
    update public.match_pins set attempts = attempts + 1 where match_id = p_match;
    return jsonb_build_object('ok', false, 'error', 'wrong_pin',
      'attempts_left', 3 - (pins.attempts + 1));
  end if;
end;
$$;

notify pgrst, 'reload schema';
