create index if not exists vendor_applications_status_idx
  on public.vendor_applications (status);

create index if not exists vendor_applications_created_at_idx
  on public.vendor_applications (created_at desc);

create index if not exists booking_inquiries_status_idx
  on public.booking_inquiries (status);

create index if not exists booking_inquiries_event_date_idx
  on public.booking_inquiries (event_date);

create index if not exists trucks_is_active_idx
  on public.trucks (is_active);

create index if not exists trucks_is_featured_idx
  on public.trucks (is_featured, featured_rank);

create index if not exists events_is_active_idx
  on public.events (is_active);

create index if not exists events_start_at_idx
  on public.events (start_at);
  
