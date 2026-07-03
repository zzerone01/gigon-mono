-- The write state machine now lives in app.gigon.io/api (Next.js route
-- handlers, docs/service/api-migration.md). What stays in the DB:
-- expire_stale_gigs (pg_cron + client sweep) and handle_new_user (trigger).
drop function if exists public.complete_onboarding(text, public.app_role, text, double precision, double precision);
drop function if exists public.redeem_invite(text, text);
drop function if exists public.set_active_role(public.app_role);
drop function if exists public.post_gig(text, public.gig_type, text, integer, text, text, text, double precision, double precision, integer);
drop function if exists public.apply_to_gig(uuid);
drop function if exists public.select_applicant(uuid);
drop function if exists public.mark_arrived(uuid);
drop function if exists public.issue_pin(uuid);
drop function if exists public.verify_pin(uuid, text);
drop function if exists public.report_no_show(uuid);
drop function if exists public.open_dispute(uuid, text, text);
drop function if exists public.post_review(uuid, integer, text[], text);
drop function if exists public.send_message(uuid, text);
drop function if exists public.cancel_match(uuid, text);
drop function if exists public.cancel_gig(uuid, text);
drop function if exists public.audit(text, uuid, uuid, jsonb); -- expire inserts audit_log directly

-- Close the last direct write path too (granted in 20260702010000, unused by the UI).
revoke update on public.profiles from authenticated;

notify pgrst, 'reload schema';
