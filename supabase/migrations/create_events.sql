create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  start_time text,
  end_time text,
  location_name text,
  address text,
  description text,
  featured boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "Allow public read active events"
  on public.events for select
  to anon, authenticated
  using (active = true);
