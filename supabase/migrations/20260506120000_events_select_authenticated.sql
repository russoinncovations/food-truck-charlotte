-- Vendor dashboard runs queries as `authenticated`; calendar browsing uses `anon`.
-- Align read access so both roles can load the same public `events` rows.
drop policy if exists "Allow public read on events" on public.events;

create policy "Allow public read on events"
  on public.events
  for select
  to anon, authenticated
  using (true);
