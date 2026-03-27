-- Inquiries captured from site forms (mirrors email notifications).
-- Run in Supabase SQL Editor or via: supabase db push / migration apply

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null
    check (type in ('book_a_truck', 'for_trucks', 'for_venues')),
  name text not null,
  email text not null,
  message text not null,
  vendor_type text,
  created_at timestamptz not null default now()
);

comment on table public.inquiries is 'Form submissions stored after successful email send';

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_type_idx on public.inquiries (type);

alter table public.inquiries enable row level security;

-- Server uses anon key: allow inserts only (tighten with a secret header or service role in production if needed)
create policy "Allow anon insert on inquiries"
  on public.inquiries
  for insert
  to anon, authenticated
  with check (true);

-- No select/update/delete for anon by default; use service role in dashboard or add explicit policies later.
