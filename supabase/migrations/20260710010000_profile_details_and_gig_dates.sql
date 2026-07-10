-- Feedback round 2 (2026-07-10):
--  1. Richer worker profiles — self-reported bio/languages/availability plus
--     platform-verified stats exposed as views (per-category completions,
--     rehires, review-tag counts). Verified stats need no identity checks:
--     they are derived from PIN-completed matches, which workers can't forge.
--  2. Gigs can be posted up to a week ahead — real start date column;
--     expiry follows the chosen day instead of a flat posted+24h.

-- 1 · profile detail columns (self-reported) --------------------------------
alter table public.profiles
  add column if not exists bio text not null default '',
  add column if not exists languages text[] not null default '{}',
  add column if not exists availability text not null default '';

-- 2 · gig start date ---------------------------------------------------------
alter table public.gigs
  add column if not exists starts_on date not null
    default ((now() at time zone 'Asia/Manila')::date);

-- 3 · verified worker stats (derived, read-only) -----------------------------
-- security_invoker so the caller's RLS applies (all three base tables carry
-- the standard select-to-authenticated policy).
create or replace view public.worker_category_stats
with (security_invoker = true) as
  select m.worker_id, g.type, count(*)::int as completed
  from public.matches m
  join public.gigs g on g.id = m.gig_id
  where m.status = 'COMPLETED'
  group by m.worker_id, g.type;

create or replace view public.worker_rehire_stats
with (security_invoker = true) as
  select worker_id, count(*)::int as rehire_businesses
  from (
    select m.worker_id
    from public.matches m
    where m.status = 'COMPLETED'
    group by m.worker_id, m.employer_id
    having count(*) > 1
  ) t
  group by worker_id;

create or replace view public.worker_tag_stats
with (security_invoker = true) as
  select r.ratee_id as worker_id, tag, count(*)::int as cnt
  from public.reviews r, unnest(r.tags) as tag
  group by r.ratee_id, tag;

grant select on public.worker_category_stats, public.worker_rehire_stats,
  public.worker_tag_stats to authenticated;
