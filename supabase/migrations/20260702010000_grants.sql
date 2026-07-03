-- Table privileges for API roles. Row access is still governed by RLS —
-- writes stay RPC-only because no INSERT/UPDATE policies exist on most
-- tables; these grants just let the policies be evaluated at all.

grant usage on schema public to anon, authenticated;

grant select on all tables in schema public to authenticated;
grant update (full_name, active_role, area, lat, lng, skills, business_name)
  on public.profiles to authenticated;

-- Future tables created by migrations get the same baseline.
alter default privileges in schema public grant select on tables to authenticated;
