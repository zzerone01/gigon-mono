-- Feedback round 1 (2026-07-10):
--  1. Broader gig categories + an "Others" catch-all — many real gigs
--     (construction labor, kitchen help, …) didn't fit the original four.
--  2. Profile photos: profiles.avatar_url + a public "avatars" bucket so
--     applicant cards can carry a face, not just initials.

-- 1 · gig categories ---------------------------------------------------------
alter type public.gig_type add value if not exists 'Construction';
alter type public.gig_type add value if not exists 'Kitchen Help';
alter type public.gig_type add value if not exists 'Events';
alter type public.gig_type add value if not exists 'Others';

-- 2 · profile photos ---------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_url text;

-- Public-read bucket; each user writes only inside their own <uid>/ folder.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
