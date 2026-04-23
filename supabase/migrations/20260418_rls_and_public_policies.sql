-- Enable RLS on all flagged tables
alter table public.booking_requests enable row level security;
alter table public.truck_schedule enable row level security;
alter table public.vendor_applications enable row level security;
alter table public.truck_opportunities enable row level security;
alter table public.events enable row level security;
alter table public.trucks enable row level security;

-- Ensure anon can still insert booking requests (the form)
drop policy if exists "Allow public inserts on booking_requests" on public.booking_requests;
create policy "Allow public inserts on booking_requests"
  on public.booking_requests for insert to anon with check (true);

-- Ensure anon can still insert vendor applications
drop policy if exists "Allow public inserts on vendor_applications" on public.vendor_applications;
create policy "Allow public inserts on vendor_applications"
  on public.vendor_applications for insert to anon with check (true);

-- Allow public read on trucks (directory)
drop policy if exists "Allow public read on trucks" on public.trucks;
create policy "Allow public read on trucks"
  on public.trucks for select to anon using (true);

-- Allow public read on events
drop policy if exists "Allow public read on events" on public.events;
create policy "Allow public read on events"
  on public.events for select to anon using (true);
