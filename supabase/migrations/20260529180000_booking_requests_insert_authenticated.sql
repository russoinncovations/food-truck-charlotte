-- Public booking form: allow insert from authenticated sessions (logged-in vendors testing the form).
-- Admin reads still require service role (no broad SELECT policy).

drop policy if exists "Allow public inserts on booking_requests" on public.booking_requests;
create policy "Allow public inserts on booking_requests"
  on public.booking_requests
  for insert
  to anon, authenticated
  with check (true);
