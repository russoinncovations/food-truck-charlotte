create table if not exists public.trucks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  cuisine text,
  vendor_type text default 'truck',
  description text,
  service_areas text,
  website text,
  instagram text,
  email text,
  photo_url text,
  catering boolean default false,
  featured boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.trucks enable row level security;

create policy "Allow public read on trucks"
  on public.trucks for select
  to anon, authenticated
  using (active = true);

create policy "Allow anon insert on trucks"
  on public.trucks for insert
  to anon, authenticated
  with check (true);
