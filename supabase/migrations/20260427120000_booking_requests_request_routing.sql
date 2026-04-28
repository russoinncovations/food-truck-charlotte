-- Booking request routing: specific vendor vs cuisine vs open (no auto-matching yet).

alter table public.booking_requests
  add column if not exists truck_id uuid references public.trucks(id) on delete set null;

alter table public.booking_requests
  add column if not exists request_type text;

alter table public.booking_requests
  add column if not exists vendor_type text;

-- Selected vendor display name (specific_vendor). Single text per current product rules.
alter table public.booking_requests
  add column if not exists preferred_trucks text;

create index if not exists booking_requests_truck_id_idx
  on public.booking_requests (truck_id)
  where truck_id is not null;

create index if not exists booking_requests_request_type_idx
  on public.booking_requests (request_type)
  where request_type is not null;
