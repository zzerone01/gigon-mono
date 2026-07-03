-- pgcrypto (crypt/gen_salt) lives in the `extensions` schema on Supabase;
-- the PIN functions pinned search_path=public and couldn't resolve it.

alter function public.issue_pin(uuid) set search_path = public, extensions;
alter function public.verify_pin(uuid, text) set search_path = public, extensions;

notify pgrst, 'reload schema';
