-- Public submissions for the "Promote an Event" flow (separate from curated `public.events` listings)
create table if not exists public.event_submissions (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_date date not null,
  start_time time,
  end_time time,
  venue_name text,
  street_address text,
  description text,
  participating_trucks text,
  is_public boolean not null default true,
  event_url text,
  graphic_url text,
  organizer_name text not null,
  organizer_email text not null,
  organizer_phone text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_event_submissions_updated_at on public.event_submissions;
create trigger trg_event_submissions_updated_at
before update on public.event_submissions
for each row
execute function public.set_updated_at();

alter table public.event_submissions enable row level security;

drop policy if exists "Allow public inserts on event_submissions" on public.event_submissions;
create policy "Allow public inserts on event_submissions"
  on public.event_submissions for insert
  to anon, authenticated
  with check (true);

-- No public select: submission details are reviewed in the admin tool / dashboard only

comment on table public.event_submissions is
  'Organizer requests to list/promote an existing event. Not for booking food trucks.';
