create table if not exists public.booking_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  status text not null default 'new'
    check (status in ('new', 'contacted', 'matched', 'closed', 'archived')),

  customer_name text,
  email text,
  phone text,
  company_name text,

  event_type text,
  event_date date,
  event_time text,
  guest_count integer,

  budget_min numeric,
  budget_max numeric,

  location_city text,
  location_state text,
  venue_name text,

  message text,
  cuisine_requested text[] not null default '{}',
  truck_count integer,
  is_flexible boolean not null default false
);

drop trigger if exists trg_booking_inquiries_updated_at on public.booking_inquiries;

create trigger trg_booking_inquiries_updated_at
before update on public.booking_inquiries
for each row
execute function public.set_updated_at();

