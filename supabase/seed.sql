-- GigOn pilot seed — Mactan zone-1 demo businesses, workers and open gigs.
-- Log in locally with test numbers 09171234001/2/3 (OTP 123456, see config.toml).

insert into public.invite_codes (code, uses_left) values ('MACTAN-30', 9999);

-- ---------- demo auth users (NPC accounts; not logged into) ----------
insert into auth.users (instance_id, id, aud, role, phone, phone_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', '639170000001', now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', '639170000002', now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', '639170000003', now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', '639170000004', now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', '639170000005', now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', '639170000006', now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', '639170000011', now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', '639170000012', now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', '639170000013', now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{}');

-- ---------- employer profiles ----------
update public.profiles set full_name = 'Rico Villanueva', active_role = 'employer', employer_verified = true, business_name = 'Kape Lokal',           area = 'Pusok',      lat = 10.3208, lng = 123.9600, rating_sum = 125, rating_count = 26, jobs_completed = 26, onboarded = true where id = '10000000-0000-4000-8000-000000000001';
update public.profiles set full_name = 'Len Dimataga',    active_role = 'employer', employer_verified = true, business_name = 'Wash Day Laundromat',  area = 'Basak',      lat = 10.2950, lng = 123.9496, rating_sum = 85,  rating_count = 18, jobs_completed = 18, onboarded = true where id = '10000000-0000-4000-8000-000000000002';
update public.profiles set full_name = 'Cora Yap',        active_role = 'employer', employer_verified = true, business_name = 'Marigondon Pharmacy',  area = 'Marigondon', lat = 10.2822, lng = 123.9740, rating_sum = 152, rating_count = 31, jobs_completed = 31, onboarded = true where id = '10000000-0000-4000-8000-000000000003';
update public.profiles set full_name = 'Cora Abella',     active_role = 'employer', employer_verified = true, business_name = 'Nanay Cora''s Eatery', area = 'Pajo',       lat = 10.3120, lng = 123.9540, rating_sum = 55,  rating_count = 12, jobs_completed = 12, onboarded = true where id = '10000000-0000-4000-8000-000000000004';
update public.profiles set full_name = 'Jun Rama',        active_role = 'employer', employer_verified = true, business_name = 'Sugbo Grill Mactan',   area = 'Newtown',    lat = 10.2870, lng = 123.9840, rating_sum = 106, rating_count = 22, jobs_completed = 22, onboarded = true where id = '10000000-0000-4000-8000-000000000005';
update public.profiles set full_name = 'Mae Sy',          active_role = 'employer', employer_verified = true, business_name = 'Island Mart',          area = 'Agus',       lat = 10.2989, lng = 123.9803, rating_sum = 41,  rating_count = 9,  jobs_completed = 9,  onboarded = true where id = '10000000-0000-4000-8000-000000000006';

-- ---------- worker profiles ----------
update public.profiles set full_name = 'Analyn Dela Cruz', active_role = 'worker', area = 'Pusok',      lat = 10.3195, lng = 123.9612, skills = '{Cleaning,Laundry}', rating_sum = 201, rating_count = 41, jobs_completed = 41, onboarded = true where id = '20000000-0000-4000-8000-000000000001';
update public.profiles set full_name = 'Jomar Bacus',      active_role = 'worker', area = 'Basak',      lat = 10.2961, lng = 123.9520, skills = '{Cleaning}',         rating_sum = 78,  rating_count = 17, jobs_completed = 17, cancel_count = 1, onboarded = true where id = '20000000-0000-4000-8000-000000000002';
update public.profiles set full_name = 'Grace Tampus',     active_role = 'worker', area = 'Marigondon', lat = 10.2840, lng = 123.9710, skills = '{Errands,Cleaning}', rating_sum = 0,   rating_count = 0,  jobs_completed = 2,  onboarded = true where id = '20000000-0000-4000-8000-000000000003';

-- ---------- open gigs (design demo set, real Mactan coordinates) ----------
insert into public.gigs (id, employer_id, title, type, description, pay, duration, when_label, area, lat, lng, slots) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Café deep clean', 'Cleaning',
   'Full clean of the dining area and kitchen after the lunch rush — mop, wipe-down, dish backlog. Supplies provided; no experience needed.',
   350, '2 hrs', 'Today · 2:00 – 4:00 PM', 'Pusok', 10.3208, 123.9600, 1),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Fold & press laundry', 'Laundry',
   'Fold, press and bag customer laundry for afternoon pickups. Steam press training on the spot.',
   250, '2 hrs', 'Today · 3:00 – 5:00 PM', 'Basak', 10.2950, 123.9496, 2),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'Package run to Newtown', 'Delivery',
   'Deliver two sealed parcels to Mactan Newtown reception. Own motorbike preferred, walking OK.',
   180, '1 hr', 'Today · 1:30 PM', 'Marigondon', 10.2822, 123.9740, 1),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 'Market errand + delivery', 'Errands',
   'Buy the morning market list (provided) and deliver to the eatery before opening.',
   200, '1.5 hrs', 'Tomorrow · 7:00 AM', 'Pajo', 10.3120, 123.9540, 1),
  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000005', 'Dish crew — dinner rush', 'Cleaning',
   'Dishwashing and bussing support for the Friday dinner rush. Meal included after shift.',
   400, '3 hrs', 'Today · 6:00 – 9:00 PM', 'Newtown', 10.2870, 123.9840, 2),
  ('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000006', 'Stockroom sorting', 'Errands',
   'Sort and shelve the weekly delivery in the stockroom. Lifting up to 15 kg.',
   300, '2 hrs', 'Tomorrow · 9:00 AM', 'Agus', 10.2989, 123.9803, 1);
