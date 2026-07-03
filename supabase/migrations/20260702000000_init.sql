-- GigOn MVP schema — PRD v1.2 FINAL (§4.1 state machine, free pilot,
-- billable_event logging, PIN completion, append-only audit log).
-- All state transitions go through SECURITY DEFINER RPCs; tables are
-- locked down so clients can't skip the state machine.

create extension if not exists pgcrypto;

-- ---------- enums ----------
create type public.app_role as enum ('worker', 'employer');
create type public.gig_type as enum ('Cleaning', 'Laundry', 'Delivery', 'Errands');
create type public.gig_status as enum ('POSTED', 'MATCHED', 'COMPLETED', 'CLOSED', 'CANCELLED', 'EXPIRED');
create type public.application_status as enum ('APPLIED', 'SELECTED', 'REJECTED', 'WITHDRAWN');
create type public.match_status as enum ('MATCHED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED');
create type public.dispute_status as enum ('OPEN', 'RESOLVED');

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'New user',
  active_role public.app_role not null default 'worker',
  area text,
  lat double precision,
  lng double precision,
  skills text[] not null default '{}',
  business_name text,
  employer_verified boolean not null default false,
  rating_sum integer not null default 0,
  rating_count integer not null default 0,
  jobs_completed integer not null default 0,
  no_show_count integer not null default 0,
  cancel_count integer not null default 0,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- invite codes (pilot employer gating, §5.1.4) ----------
create table public.invite_codes (
  code text primary key,
  uses_left integer not null default 9999,
  created_at timestamptz not null default now()
);

-- ---------- gigs ----------
create table public.gigs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles (id),
  title text not null,
  type public.gig_type not null,
  description text not null default '',
  pay integer not null check (pay > 0),
  duration text not null default '2 hrs',
  when_label text not null,
  area text not null,
  lat double precision not null,
  lng double precision not null,
  slots integer not null default 1 check (slots between 1 and 5),
  status public.gig_status not null default 'POSTED',
  expires_at timestamptz not null default now() + interval '24 hours',
  created_at timestamptz not null default now()
);
create index gigs_status_idx on public.gigs (status, created_at desc);

-- ---------- applications ----------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs (id) on delete cascade,
  worker_id uuid not null references public.profiles (id),
  status public.application_status not null default 'APPLIED',
  created_at timestamptz not null default now(),
  unique (gig_id, worker_id)
);
create index applications_gig_idx on public.applications (gig_id);
create index applications_worker_idx on public.applications (worker_id);

-- ---------- matches ----------
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs (id) on delete cascade,
  application_id uuid not null references public.applications (id),
  worker_id uuid not null references public.profiles (id),
  employer_id uuid not null references public.profiles (id),
  status public.match_status not null default 'MATCHED',
  pin_hash text,
  pin_issued_at timestamptz,
  pin_attempts integer not null default 0,
  pin_locked_until timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index matches_worker_idx on public.matches (worker_id, created_at desc);
create index matches_employer_idx on public.matches (employer_id, created_at desc);

-- ---------- billable events (₱0 during pilot — §0.1) ----------
create table public.billable_events (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches (id) on delete cascade,
  event_type text not null default 'match_confirmed',
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- chat ----------
create table public.messages (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_match_idx on public.messages (match_id, id);

-- ---------- reviews (only on PIN-completed matches — §5.7) ----------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  rater_id uuid not null references public.profiles (id),
  ratee_id uuid not null references public.profiles (id),
  stars integer not null check (stars between 1 and 5),
  tags text[] not null default '{}',
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (match_id, rater_id)
);

-- ---------- disputes (§5.9.2a) ----------
create table public.disputes (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches (id) on delete cascade,
  opener_id uuid not null references public.profiles (id),
  reason text not null,
  detail text not null default '',
  status public.dispute_status not null default 'OPEN',
  created_at timestamptz not null default now()
);

-- ---------- append-only audit log (§5.6.4) ----------
create table public.audit_log (
  id bigint generated always as identity primary key,
  match_id uuid,
  gig_id uuid,
  actor_id uuid,
  event text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.audit(p_event text, p_gig uuid, p_match uuid, p_payload jsonb default '{}')
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_log (event, gig_id, match_id, actor_id, payload)
  values (p_event, p_gig, p_match, auth.uid(), p_payload);
$$;

-- =========================================================
-- State-machine RPCs
-- =========================================================

-- Onboarding -------------------------------------------------
create or replace function public.complete_onboarding(
  p_name text, p_role public.app_role, p_area text,
  p_lat double precision default null, p_lng double precision default null
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  update public.profiles
  set full_name = coalesce(nullif(trim(p_name), ''), full_name),
      active_role = p_role,
      area = coalesce(p_area, area),
      lat = coalesce(p_lat, lat),
      lng = coalesce(p_lng, lng),
      onboarded = true
  where id = auth.uid();
end;
$$;

create or replace function public.redeem_invite(p_code text, p_business_name text default null)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_ok boolean := false;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  update public.invite_codes set uses_left = uses_left - 1
  where code = upper(trim(p_code)) and uses_left > 0
  returning true into v_ok;
  if v_ok then
    update public.profiles
    set employer_verified = true,
        active_role = 'employer',
        business_name = coalesce(nullif(trim(p_business_name), ''), business_name)
    where id = auth.uid();
  end if;
  return coalesce(v_ok, false);
end;
$$;

create or replace function public.set_active_role(p_role public.app_role)
returns void
language sql security definer set search_path = public
as $$
  update public.profiles set active_role = p_role where id = auth.uid();
$$;

-- Posting ----------------------------------------------------
create or replace function public.post_gig(
  p_title text, p_type public.gig_type, p_description text,
  p_pay integer, p_duration text, p_when_label text,
  p_area text, p_lat double precision, p_lng double precision, p_slots integer
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and employer_verified) then
    raise exception 'employer not invite-verified';
  end if;
  insert into public.gigs (employer_id, title, type, description, pay, duration, when_label, area, lat, lng, slots)
  values (auth.uid(), p_title, p_type, coalesce(p_description, ''), p_pay, p_duration, p_when_label, p_area, p_lat, p_lng, p_slots)
  returning id into v_id;
  perform public.audit('gig_posted', v_id, null, jsonb_build_object('pay', p_pay));
  return v_id;
end;
$$;

-- Worker: 1-tap apply (§5.3.5) --------------------------------
create or replace function public.apply_to_gig(p_gig uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from public.gigs where id = p_gig and status = 'POSTED' and expires_at > now()) then
    raise exception 'gig is not open';
  end if;
  if exists (select 1 from public.gigs where id = p_gig and employer_id = auth.uid()) then
    raise exception 'cannot apply to your own gig';
  end if;
  insert into public.applications (gig_id, worker_id) values (p_gig, auth.uid())
  on conflict (gig_id, worker_id) do update set status = 'APPLIED'
  returning id into v_id;
  perform public.audit('applied', p_gig, null, '{}');
  return v_id;
end;
$$;

-- Employer: select applicant → MATCHED + billable_event (§5.4.2)
create or replace function public.select_applicant(p_application uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare a record; v_match uuid;
begin
  select ap.*, g.employer_id, g.status as gig_status into a
  from public.applications ap join public.gigs g on g.id = ap.gig_id
  where ap.id = p_application;
  if a is null then raise exception 'application not found'; end if;
  if a.employer_id <> auth.uid() then raise exception 'not your gig'; end if;
  if a.gig_status <> 'POSTED' then raise exception 'gig is not open'; end if;

  insert into public.matches (gig_id, application_id, worker_id, employer_id)
  values (a.gig_id, a.id, a.worker_id, a.employer_id)
  returning id into v_match;

  update public.applications set status = 'SELECTED' where id = a.id;
  update public.gigs set status = 'MATCHED' where id = a.gig_id;
  insert into public.billable_events (match_id, event_type, amount) values (v_match, 'match_confirmed', 0);
  perform public.audit('match_confirmed', a.gig_id, v_match, jsonb_build_object('billable', true, 'amount', 0));
  return v_match;
end;
$$;

-- Worker: manual arrival (§5.5.2) ------------------------------
create or replace function public.mark_arrived(p_match uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.matches set status = 'IN_PROGRESS', arrived_at = now()
  where id = p_match and worker_id = auth.uid() and status = 'MATCHED';
  if not found then raise exception 'match not in MATCHED state'; end if;
  perform public.audit('arrived', null, p_match, '{}');
end;
$$;

-- Employer: issue one-time PIN (§5.6.1) ------------------------
create or replace function public.issue_pin(p_match uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare v_pin text;
begin
  if not exists (select 1 from public.matches where id = p_match and employer_id = auth.uid() and status = 'IN_PROGRESS') then
    raise exception 'match not in IN_PROGRESS state';
  end if;
  v_pin := lpad((floor(random() * 10000))::int::text, 4, '0');
  update public.matches
  set pin_hash = crypt(v_pin, gen_salt('bf')),
      pin_issued_at = now(), pin_attempts = 0, pin_locked_until = null
  where id = p_match;
  perform public.audit('pin_issued', null, p_match, '{}');
  return v_pin;
end;
$$;

-- Worker: verify PIN → COMPLETED (§5.6.2/5.6.3: 3 tries → 60 s lock)
create or replace function public.verify_pin(p_match uuid, p_pin text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare m record;
begin
  select * into m from public.matches where id = p_match and worker_id = auth.uid();
  if m is null then raise exception 'match not found'; end if;
  if m.status <> 'IN_PROGRESS' then raise exception 'match not in IN_PROGRESS state'; end if;
  if m.pin_hash is null or m.pin_issued_at < now() - interval '24 hours' then
    return jsonb_build_object('ok', false, 'error', 'no_active_pin');
  end if;
  if m.pin_locked_until is not null and m.pin_locked_until > now() then
    return jsonb_build_object('ok', false, 'error', 'locked',
      'locked_for', ceil(extract(epoch from m.pin_locked_until - now())));
  end if;

  if m.pin_hash = crypt(p_pin, m.pin_hash) then
    update public.matches set status = 'COMPLETED', completed_at = now(), pin_attempts = 0 where id = p_match;
    update public.gigs set status = 'COMPLETED' where id = m.gig_id;
    update public.profiles set jobs_completed = jobs_completed + 1 where id = m.worker_id;
    perform public.audit('pin_verified_completed', m.gig_id, p_match, '{}');
    return jsonb_build_object('ok', true);
  end if;

  if m.pin_attempts + 1 >= 3 then
    update public.matches set pin_attempts = 0, pin_locked_until = now() + interval '60 seconds' where id = p_match;
    perform public.audit('pin_locked', null, p_match, '{}');
    return jsonb_build_object('ok', false, 'error', 'locked', 'locked_for', 60);
  else
    update public.matches set pin_attempts = pin_attempts + 1 where id = p_match;
    return jsonb_build_object('ok', false, 'error', 'wrong_pin', 'attempts_left', 3 - (m.pin_attempts + 1));
  end if;
end;
$$;

-- Employer: report no-show (§5.6.5) — reopens the gig ----------
create or replace function public.report_no_show(p_match uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare m record;
begin
  select * into m from public.matches where id = p_match and employer_id = auth.uid() and status = 'MATCHED';
  if m is null then raise exception 'match not in MATCHED state'; end if;
  update public.matches set status = 'NO_SHOW' where id = p_match;
  update public.applications set status = 'REJECTED' where id = m.application_id;
  update public.gigs set status = 'POSTED' where id = m.gig_id;
  update public.profiles set no_show_count = no_show_count + 1 where id = m.worker_id;
  perform public.audit('no_show_recorded', m.gig_id, p_match, jsonb_build_object('worker', m.worker_id));
end;
$$;

-- Dispute (§5.9.2a) -------------------------------------------
create or replace function public.open_dispute(p_match uuid, p_reason text, p_detail text default '')
returns text
language plpgsql security definer set search_path = public
as $$
declare v_id bigint;
begin
  if not exists (select 1 from public.matches where id = p_match and auth.uid() in (worker_id, employer_id)) then
    raise exception 'not a participant';
  end if;
  insert into public.disputes (match_id, opener_id, reason, detail)
  values (p_match, auth.uid(), p_reason, coalesce(p_detail, ''))
  returning id into v_id;
  perform public.audit('dispute_opened', null, p_match, jsonb_build_object('reason', p_reason));
  return 'D-' || (1000 + v_id)::text;
end;
$$;

-- Review — only on COMPLETED matches (§5.7.1) ------------------
create or replace function public.post_review(p_match uuid, p_stars integer, p_tags text[], p_comment text default '')
returns void
language plpgsql security definer set search_path = public
as $$
declare m record; v_ratee uuid;
begin
  select * into m from public.matches where id = p_match and auth.uid() in (worker_id, employer_id);
  if m is null then raise exception 'not a participant'; end if;
  if m.status <> 'COMPLETED' then raise exception 'reviews unlock only after PIN completion'; end if;
  v_ratee := case when auth.uid() = m.worker_id then m.employer_id else m.worker_id end;
  insert into public.reviews (match_id, rater_id, ratee_id, stars, tags, comment)
  values (p_match, auth.uid(), v_ratee, p_stars, coalesce(p_tags, '{}'), coalesce(p_comment, ''));
  update public.profiles
  set rating_sum = rating_sum + p_stars, rating_count = rating_count + 1
  where id = v_ratee;
  perform public.audit('review_posted', m.gig_id, p_match, jsonb_build_object('stars', p_stars));
end;
$$;

-- Chat send (kept as RPC so the active-match rule lives server-side)
create or replace function public.send_message(p_match uuid, p_body text)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare v_id bigint;
begin
  if not exists (
    select 1 from public.matches
    where id = p_match and auth.uid() in (worker_id, employer_id)
      and status in ('MATCHED', 'IN_PROGRESS', 'COMPLETED')
  ) then
    raise exception 'chat is only open on an active match';
  end if;
  insert into public.messages (match_id, sender_id, body) values (p_match, auth.uid(), p_body)
  returning id into v_id;
  return v_id;
end;
$$;

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles enable row level security;
alter table public.invite_codes enable row level security;
alter table public.gigs enable row level security;
alter table public.applications enable row level security;
alter table public.matches enable row level security;
alter table public.billable_events enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.disputes enable row level security;
alter table public.audit_log enable row level security;

create policy "profiles are readable by signed-in users"
  on public.profiles for select to authenticated using (true);
create policy "own profile is updatable"
  on public.profiles for update to authenticated using (id = auth.uid());

-- invite_codes: RPC-only (no client policies)

create policy "open gigs are readable"
  on public.gigs for select to authenticated using (true);

create policy "applications visible to applicant and gig owner"
  on public.applications for select to authenticated
  using (worker_id = auth.uid() or exists (select 1 from public.gigs g where g.id = gig_id and g.employer_id = auth.uid()));

create policy "matches visible to participants"
  on public.matches for select to authenticated
  using (auth.uid() in (worker_id, employer_id));

create policy "billable events visible to the employer"
  on public.billable_events for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and m.employer_id = auth.uid()));

create policy "messages visible to participants"
  on public.messages for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and auth.uid() in (m.worker_id, m.employer_id)));

create policy "reviews are readable by signed-in users"
  on public.reviews for select to authenticated using (true);

create policy "disputes visible to participants"
  on public.disputes for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and auth.uid() in (m.worker_id, m.employer_id)));

-- audit_log: service-only (no client policies)

-- ---------- realtime ----------
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.applications;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.gigs;
