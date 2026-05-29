-- Date-based scheduled stops (Phase 1 discovery engine).
-- Distinct from recurring truck_schedule (day_of_week).

create table if not exists public.truck_scheduled_stops (
  id uuid primary key default gen_random_uuid(),
  truck_id uuid not null references public.trucks(id) on delete cascade,
  stop_date date not null,
  start_time time not null,
  end_time time not null,
  location_name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  is_public boolean not null default true,
  notes text,
  menu_note text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'canceled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_truck_scheduled_stops_truck_date
  on public.truck_scheduled_stops (truck_id, stop_date);

create index if not exists idx_truck_scheduled_stops_date_status
  on public.truck_scheduled_stops (stop_date, status);

alter table public.truck_scheduled_stops enable row level security;

-- Public read: public + scheduled stops on listed trucks only.
drop policy if exists "Public read public scheduled stops" on public.truck_scheduled_stops;
create policy "Public read public scheduled stops"
  on public.truck_scheduled_stops
  for select
  to anon, authenticated
  using (
    is_public = true
    and status = 'scheduled'
    and exists (
      select 1
      from public.trucks t
      where t.id = truck_scheduled_stops.truck_id
        and t.show_in_directory = true
        and t.is_active = true
        and t.status = 'active'
    )
  );

-- Vendors manage stops for trucks tied to their login email.
drop policy if exists "Vendor select own scheduled stops" on public.truck_scheduled_stops;
create policy "Vendor select own scheduled stops"
  on public.truck_scheduled_stops
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.trucks t
      where t.id = truck_scheduled_stops.truck_id
        and lower(trim(t.email)) = lower(trim(auth.jwt() ->> 'email'))
    )
  );

drop policy if exists "Vendor insert own scheduled stops" on public.truck_scheduled_stops;
create policy "Vendor insert own scheduled stops"
  on public.truck_scheduled_stops
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.trucks t
      where t.id = truck_scheduled_stops.truck_id
        and lower(trim(t.email)) = lower(trim(auth.jwt() ->> 'email'))
    )
  );

drop policy if exists "Vendor update own scheduled stops" on public.truck_scheduled_stops;
create policy "Vendor update own scheduled stops"
  on public.truck_scheduled_stops
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.trucks t
      where t.id = truck_scheduled_stops.truck_id
        and lower(trim(t.email)) = lower(trim(auth.jwt() ->> 'email'))
    )
  )
  with check (
    exists (
      select 1
      from public.trucks t
      where t.id = truck_scheduled_stops.truck_id
        and lower(trim(t.email)) = lower(trim(auth.jwt() ->> 'email'))
    )
  );

drop policy if exists "Vendor delete own scheduled stops" on public.truck_scheduled_stops;
create policy "Vendor delete own scheduled stops"
  on public.truck_scheduled_stops
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.trucks t
      where t.id = truck_scheduled_stops.truck_id
        and lower(trim(t.email)) = lower(trim(auth.jwt() ->> 'email'))
    )
  );
