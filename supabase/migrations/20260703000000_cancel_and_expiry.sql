-- Cancellation flow (PRD §4.1 CANCELLED) + gig auto-expiry.
-- Same posture as the rest of the schema: every transition is a
-- SECURITY DEFINER RPC that checks auth.uid(); no client write policies.

-- ---------- matches: record who cancelled and why ----------
alter table public.matches
  add column cancelled_by uuid references public.profiles (id),
  add column cancel_reason text,
  add column cancelled_at timestamptz;

-- ---------- worker or employer cancels a match before work starts ----------
-- Only while MATCHED (pre-arrival). After arrival, no-show / dispute paths apply.
-- Reputation: the canceller's cancel_count increments (§ reputation rules).
-- Worker cancel → the gig reopens for other applicants (like no-show).
-- Employer cancel → the gig closes as CANCELLED.
create or replace function public.cancel_match(p_match uuid, p_reason text default '')
returns void
language plpgsql security definer set search_path = public
as $$
declare m record; v_is_worker boolean;
begin
  select * into m from public.matches
  where id = p_match and auth.uid() in (worker_id, employer_id);
  if m is null then raise exception 'match not found'; end if;
  if m.status <> 'MATCHED' then
    raise exception 'only a MATCHED gig can be cancelled — after arrival use no-show or dispute';
  end if;
  v_is_worker := auth.uid() = m.worker_id;

  update public.matches
  set status = 'CANCELLED', cancelled_by = auth.uid(),
      cancel_reason = coalesce(p_reason, ''), cancelled_at = now()
  where id = p_match;
  update public.profiles set cancel_count = cancel_count + 1 where id = auth.uid();
  delete from public.match_pins where match_id = p_match;

  if v_is_worker then
    update public.applications set status = 'WITHDRAWN' where id = m.application_id;
    -- reopen unless the posting has already run out of time
    update public.gigs
    set status = case when expires_at > now() then 'POSTED' else 'EXPIRED' end::public.gig_status
    where id = m.gig_id and status = 'MATCHED';
  else
    update public.applications set status = 'REJECTED' where id = m.application_id;
    update public.gigs set status = 'CANCELLED' where id = m.gig_id and status = 'MATCHED';
  end if;

  perform public.audit('match_cancelled', m.gig_id, p_match,
    jsonb_build_object('by', case when v_is_worker then 'worker' else 'employer' end,
                       'reason', coalesce(p_reason, '')));
end;
$$;

-- ---------- employer cancels an open (unmatched) posting ----------
-- No commitment is broken yet, so no cancel_count penalty.
create or replace function public.cancel_gig(p_gig uuid, p_reason text default '')
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.gigs set status = 'CANCELLED'
  where id = p_gig and employer_id = auth.uid() and status = 'POSTED';
  if not found then raise exception 'gig is not an open posting of yours'; end if;
  update public.applications set status = 'REJECTED'
  where gig_id = p_gig and status = 'APPLIED';
  perform public.audit('gig_cancelled', p_gig, null,
    jsonb_build_object('reason', coalesce(p_reason, '')));
end;
$$;

-- ---------- auto-expiry: POSTED past expires_at → EXPIRED ----------
-- Idempotent maintenance sweep. Runs from pg_cron where available, and
-- clients also call it opportunistically when they load the feed.
create or replace function public.expire_stale_gigs()
returns integer
language plpgsql security definer set search_path = public
as $$
declare v_count integer;
begin
  with expired as (
    update public.gigs set status = 'EXPIRED'
    where status = 'POSTED' and expires_at <= now()
    returning id
  )
  insert into public.audit_log (event, gig_id, payload)
  select 'gig_expired', id, '{}' from expired;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Schedule the sweep every 10 minutes when pg_cron is available
-- (Supabase cloud has it; harmless no-op elsewhere).
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule('expire-stale-gigs')
  where exists (select 1 from cron.job where jobname = 'expire-stale-gigs');
  perform cron.schedule('expire-stale-gigs', '*/10 * * * *',
    'select public.expire_stale_gigs()');
exception when others then
  raise notice 'pg_cron unavailable — expiry runs on client loads only (%)', sqlerrm;
end;
$$;

notify pgrst, 'reload schema';
