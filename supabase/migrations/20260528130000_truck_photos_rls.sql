-- Gallery photos for truck profiles.
-- RLS: public read for listed trucks; vendors manage rows for trucks tied to login email.

alter table public.truck_photos enable row level security;

-- Public profiles: read gallery photos for active directory listings.
drop policy if exists "Public read listed truck photos" on public.truck_photos;
create policy "Public read listed truck photos"
  on public.truck_photos
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.trucks t
      where t.id = truck_photos.truck_id
        and t.show_in_directory = true
        and t.is_active = true
        and t.status = 'active'
    )
  );

-- Vendor dashboard: read gallery for own truck (including before listing goes live).
drop policy if exists "Vendor select own truck photos" on public.truck_photos;
create policy "Vendor select own truck photos"
  on public.truck_photos
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.trucks t
      where t.id = truck_photos.truck_id
        and lower(trim(coalesce(t.email, ''))) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

drop policy if exists "Vendor insert own truck photos" on public.truck_photos;
create policy "Vendor insert own truck photos"
  on public.truck_photos
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.trucks t
      where t.id = truck_photos.truck_id
        and lower(trim(coalesce(t.email, ''))) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

drop policy if exists "Vendor delete own truck photos" on public.truck_photos;
create policy "Vendor delete own truck photos"
  on public.truck_photos
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.trucks t
      where t.id = truck_photos.truck_id
        and lower(trim(coalesce(t.email, ''))) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    )
  );
