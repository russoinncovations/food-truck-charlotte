-- Event booking marketplace: extend trucks + new tables + RLS.
-- Keeps existing directory `trucks` columns; adds marketplace fields.

alter table public.trucks
  add column if not exists owner_name text,
  add column if not exists phone text,
  add column if not exists cuisine_types text[];

create table if not exists public.event_inquiries (
  id uuid primary key default gen_random_uuid(),
  host_name text not null,
  host_email text not null,
  host_phone text not null,
  event_date date not null,
  event_location text not null,
  guest_count integer not null,
  indoor_outdoor text not null,
  cuisine_preferences text not null,
  budget_range text,
  status text not null default 'open'
    check (status in ('open', 'filled', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.truck_responses (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.event_inquiries (id) on delete cascade,
  truck_id uuid not null references public.trucks (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (inquiry_id, truck_id)
);

create index if not exists event_inquiries_status_created_idx
  on public.event_inquiries (status, created_at desc);

create index if not exists truck_responses_truck_id_idx
  on public.truck_responses (truck_id);

alter table public.event_inquiries enable row level security;
alter table public.truck_responses enable row level security;

-- Public hosts submit via site (anon key).
create policy "Allow insert event_inquiries"
  on public.event_inquiries
  for insert
  to anon, authenticated
  with check (true);

-- Approved trucks (matching auth email) can see open leads.
create policy "Active trucks select open event_inquiries"
  on public.event_inquiries
  for select
  to authenticated
  using (
    status = 'open'
    and exists (
      select 1
      from public.trucks t
      where lower(trim(coalesce(t.email, ''))) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
        and t.active is true
    )
  );

-- Logged-in truck owner can read their own row (including pending approval).
create policy "Truck owner selects own trucks row"
  on public.trucks
  for select
  to authenticated
  using (
    lower(trim(coalesce(email, ''))) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );

-- Responses: only the owning active truck.
create policy "Active trucks insert truck_responses"
  on public.truck_responses
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.trucks t
      where t.id = truck_id
        and lower(trim(coalesce(t.email, ''))) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
        and t.active is true
    )
  );

create policy "Truck owner selects own truck_responses"
  on public.truck_responses
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.trucks t
      where t.id = truck_responses.truck_id
        and lower(trim(coalesce(t.email, ''))) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

-- Allow removing a row if notifying the host fails (same owner as insert).
create policy "Truck owner deletes own truck_responses"
  on public.truck_responses
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.trucks t
      where t.id = truck_responses.truck_id
        and lower(trim(coalesce(t.email, ''))) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    )
  );
